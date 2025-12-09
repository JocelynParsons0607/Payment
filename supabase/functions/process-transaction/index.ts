import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ProcessTransactionRequest {
  toUpiId: string;
  toName: string;
  amount: number;
  provider: string;
  note?: string;
}

function generateTxnId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${date}-${random}`;
}

function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldSucceed(successRate: number): boolean {
  return Math.random() < successRate;
}

function getRandomFailureReason(): string {
  const reasons = [
    'Insufficient funds',
    'Network timeout',
    'UPI ID not found',
    'Bank server unavailable',
    'Transaction declined by bank',
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: ProcessTransactionRequest = await req.json();
    const { toUpiId, toName, amount, provider, note } = requestData;

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    if (profile.wallet_balance < amount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const txnId = generateTxnId();
    const balanceBefore = profile.wallet_balance;

    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .insert({
        txn_id: txnId,
        from_user_id: user.id,
        to_upi_id: toUpiId,
        to_name: toName,
        amount,
        provider,
        status: 'PENDING',
        note: note || null,
        balance_before: balanceBefore,
        metadata: { bank_ref: `REF${Math.random().toString(36).substring(2, 12).toUpperCase()}` },
      })
      .select()
      .single();

    if (txnError || !transaction) {
      throw new Error('Failed to create transaction');
    }

    const { data: settings } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['transaction_success_rate', 'transaction_delay_ms']);

    const successRateSetting = settings?.find(s => s.setting_key === 'transaction_success_rate');
    const delaySetting = settings?.find(s => s.setting_key === 'transaction_delay_ms');

    const successRate = (successRateSetting?.setting_value as { value?: number })?.value ?? 0.9;
    const minDelay = (delaySetting?.setting_value as { min?: number })?.min ?? 2000;
    const maxDelay = (delaySetting?.setting_value as { max?: number })?.max ?? 8000;

    const processingDelay = getRandomDelay(minDelay, maxDelay);

    setTimeout(async () => {
      try {
        await supabase
          .from('transactions')
          .update({ status: 'PROCESSING' })
          .eq('id', transaction.id);

        setTimeout(async () => {
          const willSucceed = shouldSucceed(successRate);

          if (willSucceed) {
            const newBalance = balanceBefore - amount;

            await supabase
              .from('user_profiles')
              .update({ wallet_balance: newBalance })
              .eq('id', user.id);

            await supabase
              .from('transactions')
              .update({
                status: 'SUCCESS',
                balance_after: newBalance,
                processed_at: new Date().toISOString(),
              })
              .eq('id', transaction.id);
          } else {
            await supabase
              .from('transactions')
              .update({
                status: 'FAILED',
                failure_reason: getRandomFailureReason(),
                processed_at: new Date().toISOString(),
              })
              .eq('id', transaction.id);
          }
        }, processingDelay / 2);
      } catch (error) {
        console.error('Error processing transaction:', error);
      }
    }, processingDelay / 2);

    return new Response(
      JSON.stringify({ transaction }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
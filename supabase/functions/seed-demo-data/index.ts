import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function generateTxnId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${date}-${random}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const demoUsers = [
      {
        email: 'alice@demo.com',
        password: 'demo123',
        name: 'Alice Johnson',
        phone: '+91 90000 00001',
        balance: 2000.0,
      },
      {
        email: 'bob@demo.com',
        password: 'demo123',
        name: 'Bob Smith',
        phone: '+91 90000 00002',
        balance: 1500.0,
      },
      {
        email: 'carol@demo.com',
        password: 'demo123',
        name: 'Carol Davis',
        phone: '+91 90000 00003',
        balance: 500.0,
      },
    ];

    const createdUsers = [];

    for (const user of demoUsers) {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userExists = existingUser?.users?.some(u => u.email === user.email);

      let userId;

      if (!userExists) {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

        if (authError) {
          console.error(`Error creating user ${user.email}:`, authError);
          continue;
        }

        userId = authData.user.id;

        await supabase.from('user_profiles').insert({
          id: userId,
          name: user.name,
          phone: user.phone,
          email: user.email,
          wallet_balance: user.balance,
        });

        const upiId = `${user.phone.slice(-4)}${Math.random().toString(36).substring(2, 4)}@demo`;
        await supabase.from('upi_accounts').insert({
          user_id: userId,
          display_name: `${user.name}'s Account`,
          upi_id: upiId,
          bank_name: 'Demo Bank',
          is_primary: true,
        });

        createdUsers.push({ email: user.email, userId, upiId });
      } else {
        const foundUser = existingUser?.users?.find(u => u.email === user.email);
        userId = foundUser?.id;
        const { data: upiData } = await supabase
          .from('upi_accounts')
          .select('upi_id')
          .eq('user_id', userId)
          .eq('is_primary', true)
          .single();
        createdUsers.push({ email: user.email, userId, upiId: upiData?.upi_id });
      }
    }

    if (createdUsers.length >= 2) {
      const alice = createdUsers[0];
      const bob = createdUsers[1];
      const carol = createdUsers[2];

      if (alice && bob) {
        await supabase.from('contacts').upsert(
          [
            {
              owner_user_id: alice.userId,
              name: 'Bob Smith',
              upi_id: bob.upiId,
              phone: '+91 90000 00002',
            },
          ],
          { onConflict: 'owner_user_id,upi_id', ignoreDuplicates: true }
        );
      }

      if (carol) {
        await supabase.from('contacts').upsert(
          [
            {
              owner_user_id: alice.userId,
              name: 'Carol Davis',
              upi_id: carol.upiId,
              phone: '+91 90000 00003',
            },
          ],
          { onConflict: 'owner_user_id,upi_id', ignoreDuplicates: true }
        );
      }

      const providers = ['GPay', 'PhonePe', 'Paytm'];
      const statuses = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED'];

      for (let i = 0; i < 10; i++) {
        const provider = providers[Math.floor(Math.random() * providers.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const amount = Math.floor(Math.random() * 500) + 50;
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        await supabase.from('transactions').insert({
          txn_id: generateTxnId(),
          from_user_id: alice.userId,
          to_upi_id: bob.upiId,
          to_name: 'Bob Smith',
          amount,
          provider,
          status,
          balance_before: 2000,
          balance_after: status === 'SUCCESS' ? 2000 - amount : null,
          failure_reason: status === 'FAILED' ? 'Network timeout' : null,
          metadata: { bank_ref: `REF${Math.random().toString(36).substring(2, 12).toUpperCase()}` },
          created_at: createdAt.toISOString(),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo data seeded successfully',
        users: createdUsers,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const client = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: { user } } = await client.auth.getUser(
    req.headers.get("Authorization")?.replace("Bearer ", "") ?? ""
  );

  return new Response(
    JSON.stringify({ message: "Hello from template!", userId: user?.id ?? null }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

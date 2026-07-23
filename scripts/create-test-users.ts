import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabase } from "../src/lib/supabase-admin";

async function main() {
  const supabase = getSupabase();

  const users = [
    { email: "pm@vantage.test", password: "test1234", full_name: "Priya Manager", role: "project_manager" },
    { email: "director@vantage.test", password: "test1234", full_name: "Dana Director", role: "management" },
  ];

  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });
    if (error) {
      console.error(`Failed to create ${u.email}:`, error.message);
    } else {
      console.log(`Created ${u.email} (${u.role}) — id ${data.user?.id}`);
    }
  }
}

main();

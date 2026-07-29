// One-time provisioning script: turns every seeded engineer into a real,
// loginable Vantage account. Safe to re-run -- engineers that already have
// a profile_id are skipped.
import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabase } from "../../src/lib/supabase-admin";

const DEMO_PASSWORD = "test1234";

function toEmail(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.join(" ");
  const slug = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "");
  return `${slug}@vantage.test`;
}

async function main() {
  const supabase = getSupabase();

  const { data: engineers, error } = await supabase
    .from("engineers")
    .select("id, name, profile_id")
    .is("profile_id", null);
  if (error) throw error;

  if (!engineers || engineers.length === 0) {
    console.log("Every engineer already has an account. Nothing to do.");
    return;
  }

  const created: { name: string; email: string }[] = [];

  for (const eng of engineers) {
    const email = toEmail(eng.name);

    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: eng.name, role: "engineer" },
    });

    if (createError || !userData.user) {
      console.error(`Failed to create account for ${eng.name} (${email}):`, createError?.message);
      continue;
    }

    const { error: linkError } = await supabase
      .from("engineers")
      .update({ profile_id: userData.user.id })
      .eq("id", eng.id);

    if (linkError) {
      console.error(`Created account for ${eng.name} but failed to link:`, linkError.message);
      continue;
    }

    created.push({ name: eng.name, email });
  }

  console.log(`\nCreated ${created.length} engineer account(s):\n`);
  for (const c of created) {
    console.log(`  ${c.name.padEnd(20)} ${c.email}   password: ${DEMO_PASSWORD}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

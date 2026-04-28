import { request } from "../api/client.js";
import { formatUser } from "../format/user.js";
import { writeJson } from "../io.js";

interface User {
  id: string;
  username: string;
}

export async function whoami(opts: { json: boolean }): Promise<void> {
  const user = await request<User>("GET", "/v1/user/info");
  if (opts.json) {
    writeJson(user);
    return;
  }
  process.stdout.write(formatUser(user) + "\n");
}

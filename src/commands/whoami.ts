import { request } from "../api/client.js";
import { formatUser } from "../format/user.js";
import { writeJson } from "../io.js";

interface UserInfo {
  id?: string;
  name?: string;
  url?: string;
}
interface UserInfoResponse {
  data?: UserInfo;
}

export async function whoami(opts: { json: boolean }): Promise<void> {
  const res = await request<UserInfoResponse>("GET", "/v1/user/info");
  const user = res.data ?? {};
  if (opts.json) {
    writeJson(user);
    return;
  }
  process.stdout.write(formatUser(user) + "\n");
}

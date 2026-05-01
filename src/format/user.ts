interface UserLike {
  id?: string;
  name?: string;
  url?: string;
}

export function formatUser(u: UserLike): string {
  const name = u.name ?? "(unknown)";
  const id = u.id ?? "(no id)";
  return u.url ? `${name} (${id}) — ${u.url}` : `${name} (${id})`;
}

interface UserLike { id: string; username: string }

export function formatUser(u: UserLike): string {
  return `${u.username} (${u.id})`;
}

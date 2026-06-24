export function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-zA-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = [
    { label: "Weak",   color: "bg-ask" },
    { label: "Fair",   color: "bg-[#F5A623]" },
    { label: "Good",   color: "bg-[#F5A623]" },
    { label: "Strong", color: "bg-bid" },
  ];

  return { score, ...levels[Math.max(0, score - 1)] };
}

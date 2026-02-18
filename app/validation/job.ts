export function validateCreateJobInput(title: string): string | null {
  if (!title.trim()) return 'Please enter a job title.';
  return null;
}

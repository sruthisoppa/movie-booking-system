// lib/utils.ts
export const safeParseInt = (value: string, fallback: number = 0): number => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? fallback : parsed;
};

export const formDataToMovie = (formData: {
  title: string;
  description: string;
  duration: string;
  genre: string;
  poster_url: string;
}): { title: string; description: string; duration: number; genre: string; poster_url: string } => ({
  title: formData.title,
  description: formData.description,
  duration: safeParseInt(formData.duration, 120),
  genre: formData.genre,
  poster_url: formData.poster_url
});

export const formDataToPartialMovie = (formData: {
  title: string;
  description: string;
  duration: string;
  genre: string;
  poster_url: string;
}): Partial<{ title: string; description: string; duration: number; genre: string; poster_url: string }> => {
  const partial: any = {};
  
  if (formData.title) partial.title = formData.title;
  if (formData.description) partial.description = formData.description;
  if (formData.duration) partial.duration = safeParseInt(formData.duration);
  if (formData.genre) partial.genre = formData.genre;
  if (formData.poster_url) partial.poster_url = formData.poster_url;
  
  return partial;
};
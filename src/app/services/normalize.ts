export const detectLanguage = (text: string) => {
  const persianPattern = /[\u0600-\u06FF]/;
  return persianPattern.test(text) ? "persian" : "english";
};

export const normalizePersianText = (text: string) => {
  return text
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F]/g, ""); // حذف حرکات عربی
};

export const normalizeEnglishText = (text: string) => {
  // لیست کلمات پرتکرار که می‌خواهید حذف کنید
  const stopWords = [
    "the",
    "and",
    "a",
    "an",
    "of",
    "in",
    "on",
    "at",
    "to",
    "is",
    "it",
  ];

  return text
    .toLowerCase() // تبدیل به حروف کوچک
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // حذف علائم نگارشی
    .replace(/\s{2,}/g, " ") // تبدیل فاصله‌های چندگانه به یک فاصله
    .split(" ") // تبدیل به آرایه کلمات
    .filter((word) => !stopWords.includes(word)) // حذف کلمات پرتکرار
    .join(" "); // تبدیل مجدد به متن
};

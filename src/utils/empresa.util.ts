export const normalizeCnpjCpf = (value: string) => {
  return value ? value.replace(/\D/g, '') : '';
};

export const isValidCnpjCpf = (value: string): boolean => {
  const normalized = normalizeCnpjCpf(value);
  return normalized.length === 11 || normalized.length === 14;
};

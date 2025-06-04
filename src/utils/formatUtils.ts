// src/utils/formatUtils.ts

export const formatKpiValue = (
  value: number | undefined | null,
  isPercentage: boolean = false
): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "N/A";
  }

  const numericValue = Number(value);
  // Ensure we're dealing with a valid number after conversion before calling toFixed
  if (isNaN(numericValue)) {
    return "N/A";
  }

  const formattedValue = numericValue.toFixed(2);

  if (isPercentage) {
    return `${formattedValue}%`;
  }
  return formattedValue;
};

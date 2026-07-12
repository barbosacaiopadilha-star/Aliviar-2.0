type FormMessageProps = {
  variant: "error" | "success";
  children: string;
};

const variantClasses: Record<FormMessageProps["variant"], string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-green-200 bg-green-50 text-green-800",
};

export function FormMessage({ variant, children }: FormMessageProps) {
  return (
    <p
      role="alert"
      className={`rounded-lg border px-3 py-2 text-sm ${variantClasses[variant]}`}
    >
      {children}
    </p>
  );
}

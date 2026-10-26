import type { ReactNode } from 'react';

interface FieldProps {
  name: string;
  label: string;
  value?: string | number | boolean | null;
  type?: 'text' | 'number' | 'textarea' | 'checkbox';
  full?: boolean;
  readOnly?: boolean;
  onInput?: (value: string) => void;
}

/** One editor field, rendered with the same markup the original dashboard generated. */
export function Field({ name, label, value = '', type = 'text', full, readOnly, onInput }: FieldProps) {
  const id = `f_${name}`;
  let control: ReactNode;
  if (type === 'textarea') {
    control = <textarea id={id} name={name} defaultValue={String(value ?? '')} />;
  } else if (type === 'checkbox') {
    control = <input type="checkbox" style={{ width: 20, height: 20 }} id={id} name={name} defaultChecked={Boolean(value)} />;
  } else {
    control = (
      <input id={id} name={name} type={type} defaultValue={String(value ?? '')} readOnly={readOnly} onInput={onInput && ((e) => onInput(e.currentTarget.value))} />
    );
  }
  return (
    <div className={'field' + (full ? ' full' : '')}>
      <label htmlFor={id}>{label}</label>
      {control}
    </div>
  );
}

import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select } from './ui/select';
import { Switch } from './ui/switch';

const FIELD_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Select', value: 'select' },
];

function emptyField() {
  return { label: '', name: '', type: 'text', required: false, options: [''] };
}

export default function FormBuilder({
  initial,
  onSubmit,
  submitting,
  submitLabel = 'Save',
}: {
  initial?: any;
  onSubmit: (data: any) => void;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [redirectUrl, setRedirectUrl] = useState(initial?.redirect_url || '');
  const [successMessage, setSuccessMessage] = useState(initial?.success_message || '');
  const [fields, setFields] = useState(initial?.fields?.length ? initial.fields : [emptyField()]);

  const handleFieldChange = (idx, key, value) => {
    setFields(f => f.map((field, i) => i === idx ? { ...field, [key]: value } : field));
  };
  const handleFieldTypeChange = (idx, value) => {
    setFields(f => f.map((field, i) => i === idx ? { ...field, type: value, options: value === 'select' ? [''] : undefined } : field));
  };
  const handleFieldOptionChange = (idx, optIdx, value) => {
    setFields(f => f.map((field, i) => i === idx ? { ...field, options: field.options.map((o, oi) => oi === optIdx ? value : o) } : field));
  };
  const addFieldOption = idx => {
    setFields(f => f.map((field, i) => i === idx ? { ...field, options: [...field.options, ''] } : field));
  };
  const removeFieldOption = (idx, optIdx) => {
    setFields(f => f.map((field, i) => i === idx ? { ...field, options: field.options.filter((_, oi) => oi !== optIdx) } : field));
  };
  const addField = () => setFields(f => [...f, emptyField()]);
  const removeField = idx => setFields(f => f.length > 1 ? f.filter((_, i) => i !== idx) : f);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name,
      redirect_url: redirectUrl || undefined,
      success_message: successMessage || undefined,
      fields: fields.map(f => ({
        label: f.label,
        name: f.name,
        type: f.type,
        required: f.required,
        options: f.type === 'select' ? f.options.filter(Boolean) : undefined,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
      <div>
        <label className="block font-medium mb-1">Form Name</label>
        <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Contact Us" />
      </div>
      <div>
        <label className="block font-medium mb-1">Redirect URL (optional)</label>
        <Input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://yourdomain.com/thanks" />
      </div>
      <div>
        <label className="block font-medium mb-1">Success Message (optional)</label>
        <Input value={successMessage} onChange={e => setSuccessMessage(e.target.value)} placeholder="Thank you for your submission!" />
      </div>
      <div className="space-y-4">
        <div className="font-semibold">Fields</div>
        {fields.map((field, idx) => (
          <Card key={idx} className="p-4 border border-purple-100 bg-white/90 dark:bg-black/80">
            <div className="flex gap-2 mb-2">
              <Input className="flex-1" value={field.label} onChange={e => handleFieldChange(idx, 'label', e.target.value)} placeholder="Field Label" required />
              <Input className="flex-1" value={field.name} onChange={e => handleFieldChange(idx, 'name', e.target.value)} placeholder="Field Name" required />
              <Select value={field.type} onValueChange={v => handleFieldTypeChange(idx, v)}>
                {FIELD_TYPES.map(ft => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </Select>
              <Switch checked={field.required} onCheckedChange={v => handleFieldChange(idx, 'required', v)} />
              <Button type="button" variant="ghost" onClick={() => removeField(idx)} disabled={fields.length === 1}>Remove</Button>
            </div>
            {field.type === 'select' && (
              <div className="space-y-2 mt-2">
                <div className="font-medium text-xs">Select Options</div>
                {field.options.map((opt, oi) => (
                  <div key={oi} className="flex gap-2 items-center">
                    <Input value={opt} onChange={e => handleFieldOptionChange(idx, oi, e.target.value)} placeholder={`Option ${oi + 1}`} />
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeFieldOption(idx, oi)} disabled={field.options.length === 1}>Remove</Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => addFieldOption(idx)}>Add Option</Button>
              </div>
            )}
          </Card>
        ))}
        <Button type="button" variant="outline" onClick={addField}>+ Add Field</Button>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Saving...' : submitLabel}</Button>
    </form>
  );
}

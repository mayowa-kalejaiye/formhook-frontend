import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select } from './ui/select';
import { Switch } from './ui/switch';

const FIELD_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Number', value: 'number' },
  { label: 'Phone', value: 'tel' },
  { label: 'URL', value: 'url' },
  { label: 'Date', value: 'date' },
  { label: 'Password', value: 'password' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Select', value: 'select' },
  { label: 'File Upload', value: 'file' },
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
  const [description, setDescription] = useState(initial?.description || '');
  const [webhookUrl, setWebhookUrl] = useState(initial?.webhook_url || '');
  const [webhookHeaders, setWebhookHeaders] = useState(initial?.webhook_headers ? JSON.stringify(initial.webhook_headers, null, 2) : '');
  const [notificationEmail, setNotificationEmail] = useState(initial?.notification_email || '');
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
    
    // Parse webhook headers if provided
    let parsedWebhookHeaders = undefined;
    if (webhookHeaders.trim()) {
      try {
        parsedWebhookHeaders = JSON.parse(webhookHeaders);
      } catch (error) {
        alert('Invalid JSON format for webhook headers. Please check the format.');
        return;
      }
    }
    
    onSubmit({
      name,
      description: description || undefined,
      webhook_url: webhookUrl || undefined,
      webhook_headers: parsedWebhookHeaders,
      notification_email: notificationEmail || undefined,
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
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Basic Information</h3>
        
        <div>
          <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Form Name *</label>
          <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Contact Us" />
        </div>
        
        <div>
          <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Description</label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this form" />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Help organize and identify your forms</p>
        </div>
      </div>

      {/* Notifications & Webhooks */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notifications & Webhooks</h3>
        
        <div>
          <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Notification Email</label>
          <Input 
            type="email"
            value={notificationEmail} 
            onChange={e => setNotificationEmail(e.target.value)} 
            placeholder="notify@example.com" 
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Receive email notifications for new submissions</p>
        </div>
        
        <div>
          <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Webhook URL</label>
          <Input 
            type="url"
            value={webhookUrl} 
            onChange={e => setWebhookUrl(e.target.value)} 
            placeholder="https://example.com/webhook" 
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Send form data to your server in real-time</p>
        </div>
        
        <div>
          <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Webhook Headers (JSON)</label>
          <textarea
            value={webhookHeaders}
            onChange={e => setWebhookHeaders(e.target.value)}
            placeholder='{"X-API-Key": "your-key", "Content-Type": "application/json"}'
            className="w-full min-h-[100px] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Custom headers to include with webhook requests (optional)</p>
        </div>
      </div>

      {/* User Experience */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">User Experience</h3>
        
        <div>
          <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Redirect URL</label>
          <Input 
            type="url"
            value={redirectUrl} 
            onChange={e => setRedirectUrl(e.target.value)} 
            placeholder="https://yourdomain.com/thank-you" 
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Redirect users after successful submission</p>
        </div>
        
        <div>
          <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Success Message</label>
          <Input 
            value={successMessage} 
            onChange={e => setSuccessMessage(e.target.value)} 
            placeholder="Thank you for your submission!" 
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Message shown after successful submission (if no redirect URL)</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Form Fields</h3>
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

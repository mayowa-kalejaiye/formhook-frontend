import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Trash2, Plus, GripVertical, Eye } from 'lucide-react';

const FIELD_TYPES = [
  { label: 'Text', value: 'text', icon: '📝' },
  { label: 'Email', value: 'email', icon: '📧' },
  { label: 'Number', value: 'number', icon: '🔢' },
  { label: 'Phone', value: 'tel', icon: '📱' },
  { label: 'URL', value: 'url', icon: '🔗' },
  { label: 'Date', value: 'date', icon: '📅' },
  { label: 'Textarea', value: 'textarea', icon: '📄' },
  { label: 'Checkbox', value: 'checkbox', icon: '☑️' },
  { label: 'Select', value: 'select', icon: '▼' },
  { label: 'File Upload', value: 'file', icon: '📎' },
];

function emptyField() {
  return { label: '', name: '', type: 'text', required: false, options: [''] };
}

interface FormField {
  label: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface ImprovedFormBuilderProps {
  initial?: any;
  onSubmit: (data: any) => void;
  submitting?: boolean;
  submitLabel?: string;
}

export default function ImprovedFormBuilder({
  initial,
  onSubmit,
  submitting,
  submitLabel = 'Save Form',
}: ImprovedFormBuilderProps) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [webhookUrl, setWebhookUrl] = useState(initial?.webhook_url || '');
  const [notificationEmail, setNotificationEmail] = useState(initial?.notification_email || '');
  const [redirectUrl, setRedirectUrl] = useState(initial?.redirect_url || '');
  const [successMessage, setSuccessMessage] = useState(initial?.success_message || '');
  const [fields, setFields] = useState<FormField[]>(initial?.fields?.length ? initial.fields : [emptyField()]);

  const handleFieldChange = (idx: number, key: string, value: any) => {
    setFields(f => f.map((field, i) => i === idx ? { ...field, [key]: value } : field));
  };

  const handleFieldTypeChange = (idx: number, value: string) => {
    setFields(f => f.map((field, i) => i === idx ? { ...field, type: value, options: value === 'select' ? [''] : undefined } : field));
  };

  const handleFieldOptionChange = (idx: number, optIdx: number, value: string) => {
    setFields(f => f.map((field, i) => i === idx ? { ...field, options: field.options?.map((o, oi) => oi === optIdx ? value : o) } : field));
  };

  const addFieldOption = (idx: number) => {
    setFields(f => f.map((field, i) => i === idx ? { ...field, options: [...(field.options || []), ''] } : field));
  };

  const removeFieldOption = (idx: number, optIdx: number) => {
    setFields(f => f.map((field, i) => i === idx ? { ...field, options: field.options?.filter((_, oi) => oi !== optIdx) } : field));
  };

  const addField = () => setFields(f => [...f, emptyField()]);
  const removeField = (idx: number) => setFields(f => f.length > 1 ? f.filter((_, i) => i !== idx) : f);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Form name is required');
      return;
    }

    if (fields.some(f => !f.label.trim() || !f.name.trim())) {
      alert('All fields must have a label and name');
      return;
    }

    onSubmit({
      name,
      description: description || undefined,
      webhook_url: webhookUrl || undefined,
      notification_email: notificationEmail || undefined,
      redirect_url: redirectUrl || undefined,
      success_message: successMessage || undefined,
      fields: fields.map(f => ({
        label: f.label,
        name: f.name,
        type: f.type,
        required: f.required,
        options: f.type === 'select' ? f.options?.filter(Boolean) : undefined,
      })),
    });
  };

  const getFieldTypeIcon = (type: string) => {
    const fieldType = FIELD_TYPES.find(ft => ft.value === type);
    return fieldType?.icon || '📝';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
      {/* Basic Information Section */}
      <Card className="shadow-md border border-slate-200 dark:border-slate-700">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-lg">📋 Form Details</CardTitle>
          <CardDescription>Basic information about your form</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="form-name" className="font-semibold">
              Form Name <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="form-name"
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g., Contact Us, Newsletter Signup"
              required
              className="text-base"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">This is displayed in your dashboard</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="form-description">Description</Label>
            <Input 
              id="form-description"
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Brief description to help you organize your forms"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Optional. Help organize and identify your forms</p>
          </div>
        </CardContent>
      </Card>

      {/* Integration Section */}
      <Card className="shadow-md border border-slate-200 dark:border-slate-700">
        <CardHeader className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-lg">🔌 Integrations</CardTitle>
          <CardDescription>Connect to your backend services</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-email">Notification Email</Label>
            <Input 
              id="notification-email"
              type="email"
              value={notificationEmail} 
              onChange={e => setNotificationEmail(e.target.value)} 
              placeholder="notify@example.com"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Receive email alerts for new submissions</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input 
              id="webhook-url"
              type="url"
              value={webhookUrl} 
              onChange={e => setWebhookUrl(e.target.value)} 
              placeholder="https://example.com/webhook"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Receive form data in real-time via POST requests</p>
          </div>

          {/* Redirect & Success Message */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-2">
              <Label htmlFor="redirect-url">Redirect URL (Post-Submit)</Label>
              <Input 
                id="redirect-url"
                type="url"
                value={redirectUrl} 
                onChange={e => setRedirectUrl(e.target.value)} 
                placeholder="https://yourdomain.com/thank-you"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Redirect users after submission</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="success-message">Success Message</Label>
              <Input 
                id="success-message"
                value={successMessage} 
                onChange={e => setSuccessMessage(e.target.value)} 
                placeholder="Thank you for your submission!"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Shown if no redirect URL</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields Section */}
      <Card className="shadow-md border border-slate-200 dark:border-slate-700">
        <CardHeader className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">✏️ Form Fields</CardTitle>
              <CardDescription>Design your form by adding and customizing fields</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {fields.length} field{fields.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Fields List */}
          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                {/* Field Number Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <GripVertical className="h-4 w-4 text-slate-400" />
                  <Badge variant="secondary" className="text-xs">Field {idx + 1}</Badge>
                  {field.required && <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Required</Badge>}
                </div>

                {/* Field Configuration Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs font-semibold mb-1 block">Label *</Label>
                    <Input 
                      value={field.label} 
                      onChange={e => handleFieldChange(idx, 'label', e.target.value)} 
                      placeholder="e.g., Email Address"
                      className="text-sm"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold mb-1 block">Field Name *</Label>
                    <Input 
                      value={field.name} 
                      onChange={e => handleFieldChange(idx, 'name', e.target.value)} 
                      placeholder="e.g., email"
                      className="text-sm"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold mb-1 block">Type</Label>
                    <select 
                      value={field.type} 
                      onChange={e => handleFieldTypeChange(idx, e.target.value)}
                      aria-label={`Field ${idx + 1} type`}
                      title="Field type"
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <optgroup label="Text Inputs">
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="tel">Phone</option>
                        <option value="url">URL</option>
                      </optgroup>
                      <optgroup label="Date/Time">
                        <option value="date">Date</option>
                      </optgroup>
                      <optgroup label="Number">
                        <option value="number">Number</option>
                      </optgroup>
                      <optgroup label="Long Text">
                        <option value="textarea">Textarea</option>
                      </optgroup>
                      <optgroup label="Selections">
                        <option value="checkbox">Checkbox</option>
                        <option value="select">Select / Dropdown</option>
                      </optgroup>
                      <optgroup label="File">
                        <option value="file">File Upload</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <div className="flex items-center gap-2 w-full">
                      <Switch 
                        checked={field.required} 
                        onCheckedChange={v => handleFieldChange(idx, 'required', v)}
                        id={`required-${idx}`}
                      />
                      <Label htmlFor={`required-${idx}`} className="text-xs font-medium cursor-pointer whitespace-nowrap">
                        Required
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Select Options */}
                {field.type === 'select' && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Dropdown Options</p>
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded">
                      {field.options?.map((opt, oi) => (
                        <div key={oi} className="flex gap-2 items-center">
                          <Input 
                            value={opt} 
                            onChange={e => handleFieldOptionChange(idx, oi, e.target.value)} 
                            placeholder={`Option ${oi + 1}`}
                            className="text-sm flex-1"
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost"
                            onClick={() => removeFieldOption(idx, oi)}
                            disabled={field.options!.length === 1}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={() => addFieldOption(idx)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Option
                    </Button>
                  </div>
                )}

                {/* Remove Field Button */}
                <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Button 
                    type="button" 
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(idx)}
                    disabled={fields.length === 1}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove Field
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Field Button */}
          <Button 
            type="button" 
            variant="outline" 
            onClick={addField}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Field
          </Button>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button 
          type="submit" 
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          disabled={submitting}
          size="lg"
        >
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

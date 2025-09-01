import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Card, CardHeader, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogClose } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import ToastView from '../../components/ToastView';
import { fetchWithAuth } from '../../services/api';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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


// Form default values structure
const defaultFormValues = {
  name: '',
  redirect_url: '',
  success_message: '',
  description: '',
  webhook_url: '',
  webhook_secret: '',
  notification_email: '',
  webhook_headers: [{ key: '', value: '' }],
  fields: [emptyField()],
};

// Sortable Field Item Component
const SortableFieldItem = ({ id, field, idx, watchedFields, register, control, errors, handleFieldTypeChange, addFieldOption, removeFieldOption, setValue, remove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `field-${id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`p-6 border-2 ${isDragging ? 'border-purple-500 shadow-lg' : 'border-purple-300 dark:border-purple-900'} bg-white/95 dark:bg-zinc-900/90 rounded-2xl shadow-md relative`}
    >
      <div className="absolute top-2 right-4 text-xs text-zinc-400">Field {idx + 1}</div>
      <div className="flex items-center mb-4">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 mr-2 rounded hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
          tabIndex={0}
          aria-label="Drag to reorder field"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-purple-500">
            <path fillRule="evenodd" d="M2 4.5A1.5 1.5 0 013.5 3h1A1.5 1.5 0 016 4.5v1A1.5 1.5 0 014.5 7h-1A1.5 1.5 0 012 5.5v-1zm4 0A1.5 1.5 0 017.5 3h1a1.5 1.5 0 011.5 1.5v1A1.5 1.5 0 018.5 7h-1A1.5 1.5 0 016 5.5v-1zm4 0A1.5 1.5 0 0113.5 3h1a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-1zm4 0A1.5 1.5 0 0117.5 3h1a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-1zm-12 4A1.5 1.5 0 013.5 7h1a1.5 1.5 0 011.5 1.5v1A1.5 1.5 0 014.5 11h-1A1.5 1.5 0 012 9.5v-1zm4 0A1.5 1.5 0 017.5 7h1a1.5 1.5 0 011.5 1.5v1A1.5 1.5 0 018.5 11h-1A1.5 1.5 0 016 9.5v-1zm4 0a1.5 1.5 0 011.5-1.5h1a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-1zm4 0a1.5 1.5 0 011.5-1.5h1a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-1zm-12 4a1.5 1.5 0 011.5-1.5h1a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-1zm4 0a1.5 1.5 0 011.5-1.5h1a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-1zm4 0a1.5 1.5 0 011.5-1.5h1a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-1zm4 0a1.5 1.5 0 011.5-1.5h1a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5v-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="text-sm font-medium">{watchedFields[idx]?.label || `Field ${idx + 1}`}</div>
        <div className="text-xs text-zinc-400 ml-2">(Type: {watchedFields[idx]?.type || 'text'})</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
        <div>
          <Label htmlFor={`field-label-${idx}`} className="block text-xs font-medium mb-1">Label</Label>
          <Input id={`field-label-${idx}`} {...register(`fields.${idx}.label`, { required: true })} className="w-full text-sm" placeholder={idx === 0 ? "Email Address" : idx === 1 ? "Full Name" : "Field Label"} required />
          {errors.fields?.[idx]?.label && <span className="text-xs text-red-500">Label required</span>}
        </div>
        <div>
          <Label htmlFor={`field-name-${idx}`} className="block text-xs font-medium mb-1">Name <span className="text-zinc-400" title="This is the key used in your data. Use only letters, numbers, and underscores."><svg className="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9"/><path d="M10 6v4l2 2"/></svg></span></Label>
          <Input id={`field-name-${idx}`} {...register(`fields.${idx}.name`, { required: true })} className="w-full text-sm" placeholder={idx === 0 ? "email" : idx === 1 ? "name" : "field_name"} required />
          {errors.fields?.[idx]?.name && <span className="text-xs text-red-500">Name required</span>}
        </div>
        <div>
          <Label htmlFor={`field-type-${idx}`} className="block text-xs font-medium mb-1 flex items-center gap-1">Type
            <span className="text-zinc-400" title="Choose how users will fill out this field.">
              <svg className="inline w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9"/><path d="M10 6v4l2 2"/></svg>
            </span>
          </Label>
          <select 
            id={`field-type-${idx}`}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={watchedFields[idx]?.type || 'text'}
            onChange={(e) => handleFieldTypeChange(idx, e.target.value)}
          >
            {FIELD_TYPES.map(ft => (
              <option key={ft.value} value={ft.value}>{ft.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-row items-center gap-2 mt-6">
          <Controller
            control={control}
            name={`fields.${idx}.required`}
            render={({ field: ctrlField }) => (
              <>
                <Switch
                  checked={!!ctrlField.value}
                  onCheckedChange={ctrlField.onChange}
                  id={`field-required-${idx}`}
                  className={
                    'data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 data-[state=unchecked]:border-zinc-300 data-[state=unchecked]:bg-white border-2 transition-colors duration-150'
                  }
                />
                <Label htmlFor={`field-required-${idx}`} className="text-xs font-medium flex items-center gap-1">Required
                  <span className="text-zinc-400" title="If enabled, users must fill out this field.">
                    <svg className="inline w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9"/><path d="M10 6v4l2 2"/></svg>
                  </span>
                </Label>
              </>
            )}
          />
        </div>
      </div>
      {watchedFields[idx]?.type === 'select' && (
        <div className="space-y-2 mt-2 bg-purple-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-purple-100 dark:border-purple-900">
          <div className="font-semibold text-xs text-purple-700 dark:text-purple-200 mb-1">Select Options</div>
          {(watchedFields[idx].options || ['']).map((opt, oi) => (
            <div key={oi} className="flex gap-2 items-center mb-1">
              <Input value={opt} onChange={e => {
                const opts = watchedFields[idx].options || [];
                const newOpts = opts.slice();
                newOpts[oi] = e.target.value;
                setValue(`fields.${idx}.options`, newOpts);
              }} placeholder={`Option ${oi + 1}`} className="text-sm" />
              <Button type="button" size="sm" variant="ghost" onClick={() => removeFieldOption(idx, oi)} disabled={(watchedFields[idx].options || ['']).length === 1}>Remove</Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" className="mt-1" onClick={() => addFieldOption(idx)}>+ Add Option</Button>
        </div>
      )}
      <div className="flex justify-end mt-2">
        <Button type="button" variant="destructive" className="text-xs px-3 py-1" onClick={() => remove(idx)} disabled={watchedFields.length <= 1}>Remove Field</Button>
      </div>
    </Card>
  );
};

export function FormBuilderModal({ open, onOpenChange, onSuccess, initial, submitting: externalSubmitting, submitLabel, onSubmit }) {
  const toastRef = React.useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  React.useEffect(() => { setHydrated(true); }, []);

  // Merge initial values if editing
  // Audit: Only prefill webhook_secret if present in initial (never blank)
  const initialValues = initial
    ? {
        ...defaultFormValues,
        ...initial,
        webhook_secret: initial.webhook_secret || '',
        webhook_headers: initial.webhook_headers
          ? Object.entries(initial.webhook_headers).map(([key, value]) => ({ key, value }))
          : [{ key: '', value: '' }],
        fields: initial.fields && initial.fields.length > 0
          ? initial.fields.map(f => ({
              ...f,
              required: !!f.required,
              options: f.type === 'select' ? (f.options && f.options.length > 0 ? f.options : ['']) : undefined
            }))
          : [emptyField()],
      }
    : defaultFormValues;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm({
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  // Field array for fields
  const { fields, append, remove, update, move } = useFieldArray({
    control,
    name: 'fields',
  });
  
  // Set up drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag end event to reorder fields
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(field => `field-${field.id}` === active.id);
      const newIndex = fields.findIndex(field => `field-${field.id}` === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
  };

  // Field array for webhook_headers
  const {
    fields: webhookHeaderFields,
    append: appendHeader,
    remove: removeHeader,
    update: updateHeader,
  } = useFieldArray({
    control,
    name: 'webhook_headers',
  });

  // Watch fields for dynamic options
  const watchedFields = watch('fields');

  // Add option to select field
  const addFieldOption = (fieldIdx) => {
    const opts = watchedFields[fieldIdx].options || [];
    setValue(`fields.${fieldIdx}.options`, [...opts, '']);
  };
  const removeFieldOption = (fieldIdx, optIdx) => {
    const opts = watchedFields[fieldIdx].options || [];
    if (opts.length > 1) {
      setValue(`fields.${fieldIdx}.options`, opts.filter((_, i) => i !== optIdx));
    }
  };

  // On field type change, reset options if select
  const handleFieldTypeChange = (idx, value) => {
    console.log(`Changing field ${idx} type from ${watchedFields[idx]?.type} to: ${value}`);
    
    // Create a copy of the current field values
    const updatedField = { 
      ...watchedFields[idx], 
      type: value,
      options: value === 'select' ? [''] : undefined
    };
    
    // First directly set the value in the form
    setValue(`fields.${idx}.type`, value);
    
    // Then update the field array with all properties
    update(idx, updatedField);
    
    // Force a re-render by triggering a manual form change
    setTimeout(() => {
      // Log the current value to verify it was updated
      const currentType = getValues(`fields.${idx}.type`);
      console.log(`After update, field ${idx} type is: ${currentType}`);
    }, 100);
  };

  // Convert webhook_headers array to object
  const headersArrayToObject = (arr) => {
    const obj = {};
    arr.forEach(({ key, value }) => {
      if (key) obj[key] = value;
    });
    return obj;
  };

  const onFormSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        redirect_url: data.redirect_url || undefined,
        success_message: data.success_message || undefined,
        description: data.description || undefined,
        webhook_url: data.webhook_url || undefined,
        webhook_secret: data.webhook_secret || undefined,
        notification_email: data.notification_email || undefined,
        webhook_headers: headersArrayToObject(data.webhook_headers),
        fields: data.fields.map(f => ({
          label: f.label,
          name: f.name,
          type: f.type,
          required: f.required,
          options: f.type === 'select' ? (f.options || []).filter(Boolean) : undefined,
        })),
      };
      if (onSubmit) {
        await onSubmit(payload);
        onSuccess?.();
      } else {
        // Use trailing slash to match backend and api.ts
        const res = await fetchWithAuth('/forms/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create form');
        const resultData = await res.json();
        setResult(resultData);
        toastRef.current?.addNotification('success', 'Form Created', 'Your form was created successfully!', true, 3000);
        onSuccess?.(resultData);
      }
    } catch (err) {
      toastRef.current?.addNotification('error', 'Error', 'Could not create form', true, 4000);
    } finally {
      setSubmitting(false);
    }
  };

  // Live preview HTML
  const renderPreview = () => {
    // Get the latest field values to ensure preview is up-to-date
    const currentFields = getValues('fields');
    console.log('Rendering preview with fields:', currentFields);
    
    return (
      <form className="space-y-4 p-4 bg-white/80 dark:bg-black/80 rounded-lg border border-purple-100">
        {currentFields.map((f, idx) => (
          <div key={idx}>
            <label className="block font-medium mb-1">{f.label || 'Field label'}</label>
            {f.type === 'text' || f.type === 'email' ? (
              <Input type={f.type} placeholder={f.label} required={f.required} />
            ) : f.type === 'textarea' ? (
              <textarea className="w-full rounded border border-purple-200 p-2" placeholder={f.label} required={f.required} />
            ) : f.type === 'checkbox' ? (
              <div className="flex items-center gap-2">
                <input type="checkbox" id={`preview-cb-${idx}`} />
                <label htmlFor={`preview-cb-${idx}`}>{f.label}</label>
              </div>
            ) : f.type === 'select' ? (
              <select
                className="w-full rounded border border-purple-200 p-2"
                required={f.required}
                aria-label={f.label || `Select field ${idx + 1}`}
              >
                {(f.options || []).filter(Boolean).map((opt, oi) => (
                  <option key={oi}>{opt}</option>
                ))}
              </select>
            ) : null}
          </div>
        ))}
        <Button type="submit" className="w-full">Submit</Button>
      </form>
    );
  };

  // Embed snippet
  const renderEmbedSnippet = (formId) => {
    // Get the latest field values
    const liveFields = getValues('fields');
    console.log('Rendering snippet with fields:', liveFields);
    
    const fieldsHtml = (liveFields || []).map(f => {
      if (f.type === 'text' || f.type === 'email') {
        return `<input name="data[${f.name}]" type="${f.type}" placeholder="${f.label}"${f.required ? ' required' : ''} />`;
      } else if (f.type === 'textarea') {
        return `<textarea name="data[${f.name}]" placeholder="${f.label}"${f.required ? ' required' : ''}></textarea>`;
      } else if (f.type === 'checkbox') {
        return `<label><input type="checkbox" name="data[${f.name}]"${f.required ? ' required' : ''}/> ${f.label}</label>`;
      } else if (f.type === 'select') {
        return `<select name="data[${f.name}]"${f.required ? ' required' : ''}>${(f.options || []).filter(Boolean).map(opt => `<option>${opt}</option>`).join('')}</select>`;
      }
      return '';
    }).join('\n  ');
    return `<form action=\"https://formhook-backend.onrender.com/forms/${formId}/submit\" method=\"POST\">
  ${fieldsHtml}
  <button type=\"submit\">Submit</button>
</form>`;
  };

  if (!hydrated) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ToastView ref={toastRef} />
      <DialogContent className="max-w-4xl w-full p-0 bg-white dark:bg-zinc-900/95 rounded-2xl shadow-2xl border border-neutral-200 dark:border-zinc-800 backdrop-blur-md">
        <div className="relative">
          <DialogClose asChild>
            <button
              aria-label="Close"
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full p-1"
            >
              <span className="sr-only">Close</span>
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M6 6l8 8M6 14L14 6"/></svg>
            </button>
          </DialogClose>
          <Card className="bg-transparent shadow-none border-none p-0">
            <CardHeader className="pb-2 pt-8 px-12 border-b border-purple-100 dark:border-zinc-800">
              <h2 className="text-3xl font-extrabold text-purple-700 dark:text-purple-200 mb-2 tracking-tight">{initial ? 'Edit Form' : 'Create a New Form'}</h2>
              <p className="text-zinc-500 dark:text-zinc-300 text-base">Build your form and configure fields. Preview updates live.</p>
            </CardHeader>
            <CardContent className="px-12 pb-10 pt-8 bg-white/90 dark:bg-zinc-900/80 rounded-b-2xl">
              {result ? (
                <div className="space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <div className="font-semibold mb-2">Form {initial ? 'Updated' : 'Created'}!</div>
                    <div>Public Link: <a href={`/f/${result.id}`} className="underline text-purple-700" target="_blank" rel="noopener noreferrer">/f/{result.id}</a></div>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                    <div className="font-semibold mb-2">Embed Snippet</div>
                    <pre className="bg-white rounded p-2 text-xs overflow-x-auto border border-purple-100 mb-2">{renderEmbedSnippet(result.id)}</pre>
                    <Button size="sm" onClick={() => navigator.clipboard.writeText(renderEmbedSnippet(result.id))}>Copy Snippet</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-h-[70vh] overflow-y-auto">
                  {/* Form Builder */}
                  <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 flex flex-col h-full" autoComplete="off">
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="form-name" className="block text-sm font-medium mb-1">Form Name</Label>
                        <Input id="form-name" {...register('name', { required: true })} required placeholder="Contact Us" className="text-base" />
                        {errors.name && <span className="text-xs text-red-500">Form name is required</span>}
                      </div>
                      <div>
                        <Label htmlFor="redirect-url" className="block text-sm font-medium mb-1">Redirect URL <span className="text-xs text-zinc-400">(optional)</span></Label>
                        <Input id="redirect-url" {...register('redirect_url')} placeholder="https://yourdomain.com/thanks" className="text-base" />
                      </div>
                      <div>
                        <Label htmlFor="success-message" className="block text-sm font-medium mb-1">Success Message <span className="text-xs text-zinc-400">(optional)</span></Label>
                        <Input id="success-message" {...register('success_message')} placeholder="Thank you for your submission!" className="text-base" />
                      </div>
                    </div>
                    {/* Advanced Settings */}
                    <div>
                      <Button type="button" variant="outline" className="mb-2" onClick={() => setShowAdvanced(v => !v)}>
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                      </Button>
                      {showAdvanced && (
                        <div className="space-y-4 p-4 bg-purple-50 dark:bg-zinc-800/40 rounded-xl border border-purple-100 dark:border-purple-900">
                          <div>
                            <Label htmlFor="description" className="block text-xs font-medium mb-1">Description <span className="text-xs text-zinc-400">(optional)</span></Label>
                            <Input id="description" {...register('description')} placeholder="For website..." className="text-base" />
                          </div>
                          <div>
                            <Label htmlFor="webhook-url" className="block text-xs font-medium mb-1">Webhook URL <span className="text-xs text-zinc-400">(optional)</span></Label>
                            <Input id="webhook-url" {...register('webhook_url')} placeholder="https://yourdomain.com/webhook" className="text-base" />
                          </div>
                          <div>
                            <Label htmlFor="webhook-secret" className="block text-xs font-medium mb-1">Webhook Secret <span className="text-xs text-zinc-400">(optional, for HMAC signature)</span></Label>
                            <Input id="webhook-secret" {...register('webhook_secret')} placeholder="supersecret" className="text-base" />
                          </div>
                          <div>
                            <Label htmlFor="notification-email" className="block text-xs font-medium mb-1">Notification Email <span className="text-xs text-zinc-400">(optional)</span></Label>
                            <Input id="notification-email" {...register('notification_email')} placeholder="notify@yourdomain.com" className="text-base" type="email" />
                          </div>
                          {/* Webhook Headers */}
                          <div>
                            <Label className="block text-xs font-medium mb-1">Webhook Headers <span className="text-xs text-zinc-400">(optional, custom headers)</span></Label>
                            {webhookHeaderFields.map((header, idx) => (
                              <div key={header.id} className="flex gap-2 mb-1">
                                <Input placeholder="Header Key" {...register(`webhook_headers.${idx}.key`)} className="text-sm" />
                                <Input placeholder="Header Value" {...register(`webhook_headers.${idx}.value`)} className="text-sm" />
                                <Button type="button" size="sm" variant="ghost" onClick={() => removeHeader(idx)} disabled={webhookHeaderFields.length === 1}>Remove</Button>
                              </div>
                            ))}
                            <Button type="button" size="sm" variant="outline" className="mt-1" onClick={() => appendHeader({ key: '', value: '' })}>+ Add Header</Button>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Fields Section */}
                    <div className="space-y-6 mt-4">
                      <Card className="bg-purple-50/70 dark:bg-zinc-800/40 border border-purple-100 dark:border-purple-900 px-4 sm:px-6 md:px-8 lg:px-12 py-4 max-w-3xl mx-auto rounded-xl flex flex-col gap-2 w-full">
                        <div className="font-bold text-xl text-purple-700 dark:text-purple-200 flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 15h6"/></svg>
                          Fields
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <svg className="w-4 h-4 text-purple-400 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9"/><path d="M10 6v4l2 2"/></svg>
                          Add the fields you want users to fill out. Each field needs a <b>Label</b> (what users see), a <b>Name</b> (for your data), and a <b>Type</b> (input style).
                        </div>
                      </Card>
                      <div className="border-t border-purple-100 dark:border-purple-900 my-2" />
                      {fields.length === 0 && (
                        <div className="text-center text-zinc-500 py-10 border border-dashed border-purple-200 rounded-xl bg-purple-50 dark:bg-zinc-800/40 text-lg font-medium">
                          Start by adding your first field below.
                        </div>
                      )}
                      <div className="flex flex-col gap-6">
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext 
                            items={fields.map(field => `field-${field.id}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            {fields.map((field, idx) => (
                              <SortableFieldItem
                                key={field.id}
                                id={field.id}
                                field={field}
                                idx={idx}
                                watchedFields={watchedFields}
                                register={register}
                                control={control}
                                errors={errors}
                                handleFieldTypeChange={handleFieldTypeChange}
                                addFieldOption={addFieldOption}
                                removeFieldOption={removeFieldOption}
                                setValue={setValue}
                                remove={remove}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      </div>
                      <div className="flex flex-col items-center mt-2">
                        <Button type="button" variant="default" className="w-full max-w-xs font-semibold py-3 text-base" onClick={() => append(emptyField())}>+ Add Field</Button>
                      </div>
                    </div>
                    <div className="flex justify-end mt-8">
                      <Button type="submit" className="px-8 py-3 text-lg font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-lg transition-all duration-150" disabled={externalSubmitting !== undefined ? externalSubmitting : submitting}>
                        {externalSubmitting !== undefined ? (externalSubmitting ? (submitLabel ? submitLabel + '...' : 'Saving...') : (submitLabel || (initial ? 'Save Changes' : 'Create Form'))) : (submitting ? (submitLabel ? submitLabel + '...' : (initial ? 'Saving...' : 'Creating...')) : (submitLabel || (initial ? 'Save Changes' : 'Create Form')))}
                      </Button>
                    </div>
                  </form>
                  {/* Live Preview */}
                  <div className="overflow-y-auto max-h-[60vh]">
                    <Card className="border border-purple-200 bg-white/90 dark:bg-zinc-900/80 rounded-xl p-4">
                      <div className="font-semibold mb-2 text-lg">Live Preview</div>
                      <div className="text-xs text-zinc-500 mb-4">This is how your form will appear to users.</div>
                      {renderPreview()}
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Default export for /forms/new: render nothing (or could redirect)
export default function NewFormPage() {
  return null;
}

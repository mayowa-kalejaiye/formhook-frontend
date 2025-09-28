import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Card, CardHeader, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent } from '../../components/ui/dialog';
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
  { label: 'Text', value: 'text', description: 'Single line text input' },
  { label: 'Email', value: 'email', description: 'Email address with validation' },
  { label: 'Number', value: 'number', description: 'Numeric input with validation' },
  { label: 'Phone', value: 'tel', description: 'Phone number input' },
  { label: 'URL', value: 'url', description: 'Website URL with validation' },
  { label: 'Date', value: 'date', description: 'Date picker' },
  { label: 'Password', value: 'password', description: 'Password input (hidden text)' },
  { label: 'Textarea', value: 'textarea', description: 'Multi-line text input' },
  { label: 'Checkbox', value: 'checkbox', description: 'Single checkbox option' },
  { label: 'Select', value: 'select', description: 'Dropdown menu with options' },
  { label: 'File Upload', value: 'file', description: 'File upload field' },
];

function emptyField() {
  return { 
    label: '', 
    name: '', 
    type: 'text', 
    required: false, 
    options: [''],
    validation: {
      minLength: undefined,
      maxLength: undefined,
      pattern: '',
      patternMessage: '',
      min: undefined,
      max: undefined,
    }
  };
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
const SortableFieldItem = ({ id, field, idx, watchedFields, register, control, errors, handleFieldTypeChange, addFieldOption, removeFieldOption, setValue, remove, duplicate }) => {
  const [showValidation, setShowValidation] = React.useState(false);
  
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

  const fieldType = watchedFields[idx]?.type || 'text';
  const isNumericField = ['number', 'date'].includes(fieldType);
  const isTextualField = ['text', 'email', 'tel', 'url', 'password', 'textarea'].includes(fieldType);

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
              <option key={ft.value} value={ft.value} title={ft.description}>{ft.label}</option>
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
      
      {/* Field Validation Section */}
      <div className="mt-4">
        <Button 
          type="button" 
          variant="ghost" 
          className="text-xs p-1" 
          onClick={() => setShowValidation(!showValidation)}
        >
          {showValidation ? '▼' : '▶'} Validation Options
        </Button>
        
        {showValidation && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
            {isTextualField && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`field-minlength-${idx}`} className="text-xs">Min Length</Label>
                    <Input 
                      id={`field-minlength-${idx}`}
                      type="number" 
                      {...register(`fields.${idx}.validation.minLength`)}
                      placeholder="0"
                      className="text-xs"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`field-maxlength-${idx}`} className="text-xs">Max Length</Label>
                    <Input 
                      id={`field-maxlength-${idx}`}
                      type="number" 
                      {...register(`fields.${idx}.validation.maxLength`)}
                      placeholder="100"
                      className="text-xs"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`field-pattern-${idx}`} className="text-xs">Pattern (RegEx)</Label>
                  <Input 
                    id={`field-pattern-${idx}`}
                    {...register(`fields.${idx}.validation.pattern`)}
                    placeholder="^[A-Za-z]+$"
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor={`field-pattern-message-${idx}`} className="text-xs">Custom Error Message</Label>
                  <Input 
                    id={`field-pattern-message-${idx}`}
                    {...register(`fields.${idx}.validation.patternMessage`)}
                    placeholder="Please enter a valid value"
                    className="text-xs"
                  />
                </div>
              </>
            )}
            
            {isNumericField && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`field-min-${idx}`} className="text-xs">Min Value</Label>
                  <Input 
                    id={`field-min-${idx}`}
                    type="number" 
                    {...register(`fields.${idx}.validation.min`)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor={`field-max-${idx}`} className="text-xs">Max Value</Label>
                  <Input 
                    id={`field-max-${idx}`}
                    type="number" 
                    {...register(`fields.${idx}.validation.max`)}
                    className="text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-end mt-2">
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            className="text-xs px-2 py-1" 
            onClick={() => duplicate(idx)}
            title="Duplicate this field"
          >
            Copy
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            className="text-xs px-3 py-1" 
            onClick={() => remove(idx)} 
            disabled={watchedFields.length <= 1}
          >
            Remove Field
          </Button>
        </div>
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

  // Common field templates
  const fieldTemplates = [
    {
      name: 'Email Address',
      template: { label: 'Email Address', name: 'email', type: 'email', required: true, options: [''], validation: { minLength: undefined, maxLength: undefined, pattern: '', patternMessage: '', min: undefined, max: undefined } }
    },
    {
      name: 'Full Name',
      template: { label: 'Full Name', name: 'name', type: 'text', required: true, options: [''], validation: { minLength: 2, maxLength: 50, pattern: '', patternMessage: '', min: undefined, max: undefined } }
    },
    {
      name: 'Phone Number',
      template: { label: 'Phone Number', name: 'phone', type: 'tel', required: false, options: [''], validation: { minLength: 10, maxLength: 15, pattern: '', patternMessage: '', min: undefined, max: undefined } }
    },
    {
      name: 'Website URL',
      template: { label: 'Website', name: 'website', type: 'url', required: false, options: [''], validation: { minLength: undefined, maxLength: undefined, pattern: '', patternMessage: '', min: undefined, max: undefined } }
    },
    {
      name: 'Age',
      template: { label: 'Age', name: 'age', type: 'number', required: false, options: [''], validation: { minLength: undefined, maxLength: undefined, pattern: '', patternMessage: '', min: 13, max: 120 } }
    },
    {
      name: 'Message',
      template: { label: 'Message', name: 'message', type: 'textarea', required: true, options: [''], validation: { minLength: 10, maxLength: 500, pattern: '', patternMessage: '', min: undefined, max: undefined } }
    },
    {
      name: 'Country',
      template: { label: 'Country', name: 'country', type: 'select', required: false, options: ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Other'], validation: { minLength: undefined, maxLength: undefined, pattern: '', patternMessage: '', min: undefined, max: undefined } }
    },
  ];

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
              options: f.type === 'select' ? (f.options && f.options.length > 0 ? f.options : ['']) : undefined,
              validation: {
                minLength: f.validation?.minLength || undefined,
                maxLength: f.validation?.maxLength || undefined,
                pattern: f.validation?.pattern || '',
                patternMessage: f.validation?.patternMessage || '',
                min: f.validation?.min || undefined,
                max: f.validation?.max || undefined,
              }
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
    reset,
  } = useForm({
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  // Reset form when initial prop changes (for switching between create/edit modes)
  React.useEffect(() => {
    reset(initialValues);
  }, [initial, reset, initialValues]);

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

  // Duplicate a field
  const duplicateField = (idx) => {
    const fieldToDuplicate = { ...watchedFields[idx] };
    // Modify the name to make it unique
    fieldToDuplicate.name = fieldToDuplicate.name + '_copy';
    fieldToDuplicate.label = fieldToDuplicate.label + ' (Copy)';
    append(fieldToDuplicate);
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
          validation: {
            minLength: f.validation?.minLength || undefined,
            maxLength: f.validation?.maxLength || undefined,
            pattern: f.validation?.pattern || undefined,
            patternMessage: f.validation?.patternMessage || undefined,
            min: f.validation?.min || undefined,
            max: f.validation?.max || undefined,
          },
        })),
      };
      
      console.log('[FormBuilder] Submitting payload:', JSON.stringify(payload, null, 2));
      
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

  // Code Integration Examples
  const renderCodeExamples = () => {
    const currentFields = getValues('fields');
    const formName = getValues('name') || 'your-form';
    const formId = 'YOUR_FORM_ID'; // Will be replaced with actual ID after creation
    
    const htmlExample = `<form action="https://formhook-backend.onrender.com/forms/${formId}/submit" method="POST" enctype="multipart/form-data">
  ${currentFields.map(f => {
    const validationAttrs = [];
    if (f.required) validationAttrs.push('required');
    if (f.validation?.minLength) validationAttrs.push(`minlength="${f.validation.minLength}"`);
    if (f.validation?.maxLength) validationAttrs.push(`maxlength="${f.validation.maxLength}"`);
    if (f.validation?.pattern) validationAttrs.push(`pattern="${f.validation.pattern}"`);
    if (f.validation?.min) validationAttrs.push(`min="${f.validation.min}"`);
    if (f.validation?.max) validationAttrs.push(`max="${f.validation.max}"`);
    const attrs = validationAttrs.length > 0 ? ' ' + validationAttrs.join(' ') : '';
    
    if (f.type === 'text' || f.type === 'email' || f.type === 'number' || f.type === 'tel' || f.type === 'url' || f.type === 'password' || f.type === 'date') {
      return `  <label for="${f.name}">${f.label}${f.required ? ' *' : ''}</label>
  <input type="${f.type}" id="${f.name}" name="data[${f.name}]" placeholder="${f.label}"${attrs} />`;
    } else if (f.type === 'textarea') {
      return `  <label for="${f.name}">${f.label}${f.required ? ' *' : ''}</label>
  <textarea id="${f.name}" name="data[${f.name}]" placeholder="${f.label}"${attrs}></textarea>`;
    } else if (f.type === 'checkbox') {
      return `  <label>
    <input type="checkbox" name="data[${f.name}]"${f.required ? ' required' : ''} />
    ${f.label}${f.required ? ' *' : ''}
  </label>`;
    } else if (f.type === 'select') {
      return `  <label for="${f.name}">${f.label}${f.required ? ' *' : ''}</label>
  <select id="${f.name}" name="data[${f.name}]"${f.required ? ' required' : ''}>
    <option value="">Choose an option...</option>
    ${(f.options || []).filter(Boolean).map(opt => `    <option value="${opt}">${opt}</option>`).join('\n')}
  </select>`;
    } else if (f.type === 'file') {
      return `  <label for="${f.name}">${f.label}${f.required ? ' *' : ''}</label>
  <input type="file" id="${f.name}" name="data[${f.name}]"${f.required ? ' required' : ''} />`;
    }
    return '';
  }).join('\n  ')}
  <button type="submit">Submit</button>
</form>`;

    const reactExample = `// React Hook Form example
import { useForm } from 'react-hook-form';

export function ${formName.replace(/[^a-zA-Z0-9]/g, '')}Form() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = async (data) => {
    try {
      const response = await fetch('https://formhook-backend.onrender.com/forms/${formId}/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      
      if (response.ok) {
        alert('Form submitted successfully!');
      } else {
        alert('Error submitting form');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
${currentFields.map(f => {
  const validation = [];
  if (f.required) validation.push('required: true');
  if (f.validation?.minLength) validation.push(`minLength: ${f.validation.minLength}`);
  if (f.validation?.maxLength) validation.push(`maxLength: ${f.validation.maxLength}`);
  if (f.validation?.pattern) validation.push(`pattern: /${f.validation.pattern}/`);
  const validationStr = validation.length > 0 ? `, { ${validation.join(', ')} }` : '';
  
  if (f.type === 'textarea') {
    return `      <textarea {...register('data.${f.name}'${validationStr})} placeholder="${f.label}" />
      {errors.data?.${f.name} && <span>This field is required</span>}`;
  } else if (f.type === 'select') {
    return `      <select {...register('data.${f.name}'${validationStr})}>
        <option value="">Choose an option...</option>
        ${(f.options || []).filter(Boolean).map(opt => `        <option value="${opt}">${opt}</option>`).join('\n')}
      </select>
      {errors.data?.${f.name} && <span>This field is required</span>}`;
  } else {
    return `      <input type="${f.type}" {...register('data.${f.name}'${validationStr})} placeholder="${f.label}" />
      {errors.data?.${f.name} && <span>This field is required</span>}`;
  }
}).join('\n')}
      <button type="submit">Submit</button>
    </form>
  );
}`;

    const curlExample = `# Test your form with curl
curl -X POST https://formhook-backend.onrender.com/forms/${formId}/submit \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": {
${currentFields.map(f => {
  if (f.type === 'email') return `      "${f.name}": "user@example.com"`;
  if (f.type === 'number') return `      "${f.name}": 123`;
  if (f.type === 'tel') return `      "${f.name}": "+1234567890"`;
  if (f.type === 'url') return `      "${f.name}": "https://example.com"`;
  if (f.type === 'date') return `      "${f.name}": "2024-01-01"`;
  if (f.type === 'checkbox') return `      "${f.name}": true`;
  if (f.type === 'select' && f.options?.[0]) return `      "${f.name}": "${f.options[0]}"`;
  return `      "${f.name}": "Sample ${f.label}"`;
}).join(',\n')}
    }
  }'`;

    return (
      <div className="space-y-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium border-b-2 border-purple-600 text-purple-600"
          >
            HTML
          </button>
        </div>
        
        {/* HTML Example */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Plain HTML Form</h4>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(htmlExample)}
              className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-2 py-1 rounded"
            >
              Copy
            </button>
          </div>
          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded border overflow-x-auto">
            <code>{htmlExample}</code>
          </pre>
        </div>
        
        {/* React Example */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">React Hook Form</h4>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(reactExample)}
              className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-2 py-1 rounded"
            >
              Copy
            </button>
          </div>
          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded border overflow-x-auto">
            <code>{reactExample}</code>
          </pre>
        </div>
        
        {/* cURL Example */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Test with cURL</h4>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(curlExample)}
              className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-2 py-1 rounded"
            >
              Copy
            </button>
          </div>
          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded border overflow-x-auto">
            <code>{curlExample}</code>
          </pre>
        </div>
        
        {/* API Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-sm mb-2 text-blue-800 dark:text-blue-200">API Endpoint Info</h4>
          <div className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
            <div><strong>POST:</strong> https://formhook-backend.onrender.com/forms/{formId}/submit</div>
            <div><strong>Content-Type:</strong> application/json or multipart/form-data</div>
            <div><strong>Response:</strong> 200 OK with {"{ success: true, message: '...' }"}</div>
            <div><strong>Webhook:</strong> {getValues('webhook_url') ? 'Configured ✓' : 'Not configured'}</div>
          </div>
        </div>
      </div>
    );
  };

  // Embed snippet
  const renderEmbedSnippet = (formId) => {
    // Get the latest field values
    const liveFields = getValues('fields');
    console.log('Rendering snippet with fields:', liveFields);
    
    const fieldsHtml = (liveFields || []).map(f => {
      const validationAttrs = [];
      if (f.required) validationAttrs.push('required');
      if (f.validation?.minLength) validationAttrs.push(`minlength="${f.validation.minLength}"`);
      if (f.validation?.maxLength) validationAttrs.push(`maxlength="${f.validation.maxLength}"`);
      if (f.validation?.pattern) validationAttrs.push(`pattern="${f.validation.pattern}"`);
      if (f.validation?.min) validationAttrs.push(`min="${f.validation.min}"`);
      if (f.validation?.max) validationAttrs.push(`max="${f.validation.max}"`);
      const attrs = validationAttrs.length > 0 ? ' ' + validationAttrs.join(' ') : '';
      
      if (f.type === 'text' || f.type === 'email' || f.type === 'number' || f.type === 'tel' || f.type === 'url' || f.type === 'password' || f.type === 'date') {
        return `<input name="data[${f.name}]" type="${f.type}" placeholder="${f.label}"${attrs} />`;
      } else if (f.type === 'textarea') {
        return `<textarea name="data[${f.name}]" placeholder="${f.label}"${attrs}></textarea>`;
      } else if (f.type === 'checkbox') {
        return `<label><input type="checkbox" name="data[${f.name}]"${f.required ? ' required' : ''}/> ${f.label}</label>`;
      } else if (f.type === 'select') {
        return `<select name="data[${f.name}]"${f.required ? ' required' : ''}><option value="">Choose an option...</option>${(f.options || []).filter(Boolean).map(opt => `<option value="${opt}">${opt}</option>`).join('')}</select>`;
      } else if (f.type === 'file') {
        return `<input name="data[${f.name}]" type="file"${f.required ? ' required' : ''} />`;
      }
      return '';
    }).join('\n  ');
    return `<form action=\"https://formhook-backend.onrender.com/forms/${formId}/submit\" method=\"POST\" enctype=\"multipart/form-data\">
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
                                duplicate={duplicateField}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      </div>
                      <div className="flex flex-col items-center mt-2">
                        <Button type="button" variant="default" className="w-full max-w-xs font-semibold py-3 text-base" onClick={() => append(emptyField())}>+ Add Field</Button>
                        
                        {/* Quick Templates */}
                        <div className="mt-4 w-full max-w-2xl">
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Or add from templates:</div>
                          <div className="flex flex-wrap gap-2">
                            {fieldTemplates.map((template, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full transition-colors"
                                onClick={() => append(template.template)}
                              >
                                + {template.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-8">
                      <Button type="submit" className="px-8 py-3 text-lg font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-lg transition-all duration-150" disabled={externalSubmitting !== undefined ? externalSubmitting : submitting}>
                        {externalSubmitting !== undefined ? (externalSubmitting ? (submitLabel ? submitLabel + '...' : 'Saving...') : (submitLabel || (initial ? 'Save Changes' : 'Create Form'))) : (submitting ? (submitLabel ? submitLabel + '...' : (initial ? 'Saving...' : 'Creating...')) : (submitLabel || (initial ? 'Save Changes' : 'Create Form')))}
                      </Button>
                    </div>
                  </form>
                  {/* Code Integration Examples */}
                  <div className="overflow-y-auto max-h-[60vh]">
                    <Card className="border border-purple-200 bg-white/90 dark:bg-zinc-900/80 rounded-xl p-4">
                      <div className="font-semibold mb-2 text-lg">Integration Examples</div>
                      <div className="text-xs text-zinc-500 mb-4">Copy-paste ready code to integrate your form.</div>
                      {renderCodeExamples()}
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

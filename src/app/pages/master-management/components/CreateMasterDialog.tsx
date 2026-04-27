import { useState } from 'react';
import { X, Trash2, ChevronDown, ChevronUp, Info, Plus } from 'lucide-react';
import { masterManagementApi } from '../../../services/mockApi';
import type { FieldDataType, ValidationType, MasterField } from '../../../types/masterManagement';
import { VALIDATION_TYPE_LABELS } from '../../../types/masterManagement';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ValidationDraft {
  id: string;
  type: ValidationType | '';
  value: string;
}

interface FieldDraft {
  id: string;
  fieldName: string;
  dataType: FieldDataType | '';
  isPrimary: boolean;
  validations: ValidationDraft[];
  validationsOpen: boolean;
  errors: { fieldName?: string; dataType?: string };
}

interface FormErrors {
  name?: string;
  masterCode?: string;
  description?: string;
  fields?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'master' | 'submaster';
  masterId?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2);

const makeEmptyField = (): FieldDraft => ({
  id: uid(), fieldName: '', dataType: '', isPrimary: false,
  validations: [], validationsOpen: true, errors: {},
});

const VALIDATION_OPTIONS = Object.entries(VALIDATION_TYPE_LABELS) as [ValidationType, string][];

// ─── Component ───────────────────────────────────────────────────────────────

export function CreateMasterDialog({ open, onClose, onSuccess, mode, masterId }: Props) {
  const isSub = mode === 'submaster';

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [savedFields, setSavedFields] = useState<MasterField[]>([]);
  const [currentField, setCurrentField] = useState<FieldDraft>(makeEmptyField());
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  // ── field helpers ──

  const updateCurrentField = (patch: Partial<FieldDraft>) =>
    setCurrentField((f) => ({ ...f, ...patch }));

  const addValidation = () =>
    updateCurrentField({ validations: [...currentField.validations, { id: uid(), type: '', value: '' }] });

  const updateValidation = (valId: string, patch: Partial<ValidationDraft>) =>
    updateCurrentField({
      validations: currentField.validations.map((v) => v.id === valId ? { ...v, ...patch } : v),
    });

  const removeValidation = (valId: string) =>
    updateCurrentField({ validations: currentField.validations.filter((v) => v.id !== valId) });

  const validateCurrentField = (): boolean => {
    const errors: FieldDraft['errors'] = {};
    if (!currentField.fieldName.trim()) errors.fieldName = 'This field is required';
    if (!currentField.dataType) errors.dataType = 'This field is required';
    updateCurrentField({ errors });
    return Object.keys(errors).length === 0;
  };

  const handleAddField = () => {
    if (!validateCurrentField()) return;
    const hasExistingPrimary = savedFields.some((f) => f.isPrimary);
    const field: MasterField = {
      id: uid(),
      fieldName: currentField.fieldName.trim(),
      dataType: currentField.dataType as FieldDataType,
      isPrimary: hasExistingPrimary ? false : currentField.isPrimary,
      validations: currentField.validations
        .filter((v) => v.type && v.value)
        .map((v) => ({ id: uid(), type: v.type as ValidationType, value: v.value })),
    };
    setSavedFields((prev) => [...prev, field]);
    setCurrentField(makeEmptyField());
  };

  const removeSavedField = (id: string) =>
    setSavedFields((prev) => prev.filter((f) => f.id !== id));

  // ── submit ──

  const handleSubmit = async () => {
    const errors: FormErrors = {};
    if (!name.trim()) errors.name = 'This field is required';
    if (!code.trim()) errors.masterCode = 'This field is required';
    if (!description.trim()) errors.description = 'This field is required';

    // validate current field form — require at least one field total
    const currentFieldValid = currentField.fieldName.trim() && currentField.dataType;
    if (savedFields.length === 0 && !currentFieldValid) {
      updateCurrentField({
        errors: {
          fieldName: !currentField.fieldName.trim() ? 'This field is required' : undefined,
          dataType: !currentField.dataType ? 'This field is required' : undefined,
        },
      });
      errors.fields = 'At least one field is required';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // build final fields list
    let allFields = [...savedFields];
    if (currentField.fieldName.trim() && currentField.dataType) {
      allFields.push({
        id: uid(),
        fieldName: currentField.fieldName.trim(),
        dataType: currentField.dataType as FieldDataType,
        isPrimary: savedFields.length === 0 ? currentField.isPrimary : currentField.isPrimary,
        validations: currentField.validations
          .filter((v) => v.type && v.value)
          .map((v) => ({ id: uid(), type: v.type as ValidationType, value: v.value })),
      });
    }

    try {
      setSubmitting(true);
      if (isSub && masterId) {
        await masterManagementApi.createSubMaster(masterId, {
          name: name.trim(),
          subMasterCode: code.trim(),
          description: description.trim(),
          fields: allFields,
        });
      } else {
        await masterManagementApi.create({
          name: name.trim(),
          masterCode: code.trim(),
          description: description.trim(),
          fields: allFields,
        });
      }
      handleClose();
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName(''); setCode(''); setDescription('');
    setSavedFields([]); setCurrentField(makeEmptyField());
    setFormErrors({});
    onClose();
  };

  const hasPrimary = savedFields.some((f) => f.isPrimary) || (savedFields.length === 0 && currentField.isPrimary);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {isSub ? 'Create Sub Master' : 'Create Master'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <input
              type="text"
              placeholder={`Name${' '}*`}
              value={name}
              onChange={(e) => { setName(e.target.value); setFormErrors((p) => ({ ...p, name: undefined })); }}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.name ? 'border-red-400' : 'border-gray-300'}`}
            />
            {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
          </div>

          {/* Code */}
          <div>
            <input
              type="text"
              placeholder={`${isSub ? 'Sub Master Code' : 'Master Code'} *`}
              value={code}
              onChange={(e) => { setCode(e.target.value); setFormErrors((p) => ({ ...p, masterCode: undefined })); }}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.masterCode ? 'border-red-400' : 'border-gray-300'}`}
            />
            {formErrors.masterCode && <p className="text-xs text-red-500 mt-1">{formErrors.masterCode}</p>}
          </div>

          {/* Description */}
          <div>
            <textarea
              placeholder={`Description *`}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setFormErrors((p) => ({ ...p, description: undefined })); }}
              rows={3}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${formErrors.description ? 'border-red-400' : 'border-gray-300'}`}
            />
            {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
          </div>

          <hr className="border-gray-200" />

          {/* Field Details Section */}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Field Details Section <span className="text-red-500">*</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Define the columns for your master data table</p>
          </div>

          {/* Primary Column info banner */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Primary Column</p>
              <p className="text-xs text-gray-600">Select one field as the primary column. Only one field can be marked as primary.</p>
            </div>
          </div>

          {/* Already-saved fields */}
          {savedFields.length > 0 && (
            <div className="space-y-2">
              {savedFields.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <span className="font-medium text-gray-800">{f.fieldName}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{f.dataType}</span>
                    {f.isPrimary && <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">Primary</span>}
                    <button onClick={() => removeSavedField(f.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current field form card */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            {/* Field Name + Data Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Field Name *"
                  value={currentField.fieldName}
                  onChange={(e) => updateCurrentField({ fieldName: e.target.value, errors: { ...currentField.errors, fieldName: undefined } })}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentField.errors.fieldName ? 'border-red-400 placeholder-red-400' : 'border-gray-300'}`}
                />
                {currentField.errors.fieldName && (
                  <p className="text-xs text-red-500 mt-1">{currentField.errors.fieldName}</p>
                )}
              </div>
              <div>
                <select
                  value={currentField.dataType}
                  onChange={(e) => updateCurrentField({ dataType: e.target.value as FieldDataType, errors: { ...currentField.errors, dataType: undefined } })}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${currentField.errors.dataType ? 'border-red-400' : 'border-gray-300'} ${!currentField.dataType ? 'text-gray-400' : 'text-gray-800'}`}
                >
                  <option value="" disabled>Select Data Type *</option>
                  <option value="TEXT">Text</option>
                  <option value="NUMBER">Number</option>
                </select>
                {currentField.errors.dataType && (
                  <p className="text-xs text-red-500 mt-1">{currentField.errors.dataType}</p>
                )}
              </div>
            </div>

            {/* Primary Column checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentField.isPrimary}
                disabled={hasPrimary && !currentField.isPrimary}
                onChange={(e) => updateCurrentField({ isPrimary: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Primary Column</span>
            </label>

            {/* Validations for Field */}
            <div>
              <button
                type="button"
                onClick={() => updateCurrentField({ validationsOpen: !currentField.validationsOpen })}
                className="flex items-center justify-between w-full"
              >
                <span className="text-sm font-medium text-gray-700">Validations for Field</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
                    {currentField.validations.length}
                  </span>
                  {currentField.validationsOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </div>
              </button>

              {currentField.validationsOpen && (
                <div className="mt-2">
                  {currentField.validations.length === 0 ? (
                    <div className="border border-gray-200 rounded-lg px-4 py-4 text-center text-sm text-gray-400 bg-gray-50">
                      No validations added.
                    </div>
                  ) : (
                    <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                      {currentField.validations.map((val) => (
                        <div key={val.id} className="flex items-center gap-2">
                          <select
                            value={val.type}
                            onChange={(e) => updateValidation(val.id, { type: e.target.value as ValidationType })}
                            className={`flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${!val.type ? 'text-gray-400' : 'text-gray-800'}`}
                          >
                            <option value="" disabled>Validation Type *</option>
                            {VALIDATION_OPTIONS.map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Value *"
                            value={val.value}
                            onChange={(e) => updateValidation(val.id, { value: e.target.value })}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button onClick={() => removeValidation(val.id)} className="text-gray-400 hover:text-red-500 p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Validation */}
                  <button
                    type="button"
                    onClick={addValidation}
                    className="mt-2 w-full border border-gray-300 rounded-lg py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
                  >
                    <Plus size={14} />
                    Add Validation
                  </button>
                </div>
              )}
            </div>

            {/* Add this Field */}
            <button
              type="button"
              onClick={handleAddField}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-1"
            >
              <Plus size={14} />
              Add this Field
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60"
          >
            {isSub ? 'Create Sub Master' : 'Create Master'}
          </button>
        </div>
      </div>
    </div>
  );
}

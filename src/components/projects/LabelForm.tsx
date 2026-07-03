"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ColorPicker from "@/components/ui/ColorPicker";
import { createLabel, updateLabel } from "@/hooks/useLabels";
import { Label } from "@/lib/types";

export default function LabelForm({
  label,
  onClose,
}: {
  label?: Label;
  onClose: () => void;
}) {
  const [name, setName] = useState(label?.name ?? "");
  const [color, setColor] = useState(label?.color ?? "#6366f1");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    if (label) {
      await updateLabel(label.id, { name, color });
    } else {
      await createLabel(name, color);
    }
    onClose();
  }

  return (
    <Modal title={label ? "Edit label" : "New label"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
            placeholder="Label name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {label ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import mongoose from "mongoose";

const SectionRoutineSchema = new mongoose.Schema(
  {
    name: String,
    timetable: { type: mongoose.Schema.Types.Mixed, required: true } // { Monday: [slot|null], ... }
  },
  { _id: false }
);

const RoutineSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },
    year: { type: Number, required: true, min: 1, max: 4 },
    semester: { type: Number, min: 1, max: 8, default: 1 },
    batchYear: { type: Number, min: 2026, max: 2100, default: undefined },
    periodsPerDay: { type: Number, required: true },
    sections: { type: [SectionRoutineSchema], default: [] },
    unsatisfied: { type: [mongoose.Schema.Types.Mixed], default: [] },
    constraints: { type: mongoose.Schema.Types.Mixed },
    quality: { type: mongoose.Schema.Types.Mixed, default: {} },
    meta: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

RoutineSchema.index({ department: 1, year: 1, semester: 1, batchYear: 1 }, { unique: true });

export const Routine = mongoose.model("Routine", RoutineSchema);

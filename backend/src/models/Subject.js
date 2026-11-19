import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true, trim: true },
    subjectCode: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    defaultClassesPerWeek: { type: Number, default: 0, min: 0 },
    semester: { type: Number, min: 1, max: 8, default: undefined },
    electiveGroup: { type: String, trim: true, default: undefined }
  },
  { timestamps: true }
);

SubjectSchema.index({ subjectCode: 1, department: 1 }, { unique: true });

export const Subject = mongoose.model("Subject", SubjectSchema);

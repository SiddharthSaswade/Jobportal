import mongoose from 'mongoose';
import { APPLICATION_STATUSES } from '../constants.js';

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job is required'],
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Candidate is required'],
    },
    status: {
      type: String,
      enum: {
        values: APPLICATION_STATUSES,
        message: '{VALUE} is not a valid application status',
      },
      default: 'applied',
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
      default: '',
    },
  },
  { timestamps: true, versionKey: false }
);

// One application per candidate per job, and it also speeds up job-based lookups.
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

// Candidate's "my applications" list.
applicationSchema.index({ candidate: 1, createdAt: -1 });

// Recruiter's applicant list, optionally filtered by status.
applicationSchema.index({ job: 1, status: 1, createdAt: -1 });

export const Application = mongoose.model('Application', applicationSchema);

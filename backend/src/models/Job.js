import mongoose from 'mongoose';
import { EXPERIENCE_LEVELS, JOB_TYPES, WORK_MODES } from '../constants.js';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [3, 'Job title must be at least 3 characters long'],
      maxlength: [100, 'Job title cannot exceed 100 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    jobType: {
      type: String,
      enum: {
        values: JOB_TYPES,
        message: '{VALUE} is not a valid job type',
      },
      default: 'full-time',
    },
    workMode: {
      type: String,
      enum: {
        values: WORK_MODES,
        message: '{VALUE} is not a valid work mode',
      },
      default: 'onsite',
    },
    experienceLevel: {
      type: String,
      enum: {
        values: EXPERIENCE_LEVELS,
        message: '{VALUE} is not a valid experience level',
      },
      default: 'fresher',
    },
    salaryMin: {
      type: Number,
      min: [0, 'Salary cannot be negative'],
      default: 0,
    },
    salaryMax: {
      type: Number,
      min: [0, 'Salary cannot be negative'],
      default: 0,
      validate: {
        validator: function (value) {
          return value == null || this.salaryMin == null || value >= this.salaryMin;
        },
        message: 'salaryMax must be greater than or equal to salaryMin',
      },
    },
    skillsRequired: {
      type: [{ type: String, trim: true }],
      validate: {
        validator: (skills) => skills.length > 0 && skills.every((skill) => skill.length > 0),
        message: 'At least one non-empty skill is required',
      },
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters long'],
    },
    deadline: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter who posted this job is required'],
    },
  },
  { timestamps: true, versionKey: false }
);

// Text index powers ?keyword= search. Weights make title matches rank highest.
jobSchema.index(
  { title: 'text', company: 'text', description: 'text', skillsRequired: 'text' },
  {
    name: 'job_text_index',
    weights: { title: 5, skillsRequired: 3, company: 2, description: 1 },
  }
);

// Recruiter's "my jobs" page and the default newest-first listing.
jobSchema.index({ postedBy: 1, createdAt: -1 });
jobSchema.index({ createdAt: -1 });

// Skills filter uses $all on this array.
jobSchema.index({ skillsRequired: 1 });

export const Job = mongoose.model('Job', jobSchema);

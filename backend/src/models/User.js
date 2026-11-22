import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const SALT_ROUNDS = 12;

// Resume text can be up to 20 KB, so it is excluded from normal queries and
// only loaded by the resume/matching endpoints via .select('+resume.text').
const resumeSchema = new mongoose.Schema(
  {
    text: { type: String, default: '', select: false },
    hasResume: { type: Boolean, default: false },
    fileName: { type: String, default: '' },
    skills: { type: [{ type: String, trim: true }], default: [] },
    yearsExperience: { type: Number, default: 0, min: 0 },
    updatedAt: { type: Date },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['candidate', 'recruiter'],
        message: '{VALUE} is not a valid role',
      },
      default: 'candidate',
    },
    resume: {
      type: resumeSchema,
      default: () => ({}),
    },
  },
  { timestamps: true, versionKey: false }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export const User = mongoose.model('User', userSchema);

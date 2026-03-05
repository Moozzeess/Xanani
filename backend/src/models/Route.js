const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  stops: [
    {
      type: String
    }
  ],

  dispatchConfig: {
    mode: {
      type: String,
      enum: ['interval', 'capacity', 'mixed', 'schedule'],
      default: 'interval'
    },

    intervalMinutes: {
      type: Number,
      default: null
    },

    requireFullVehicle: {
      type: Boolean,
      default: false
    },

    maxCapacity: {
      type: Number,
      default: 15
    },

    schedule: [
      {
        type: String
      }
    ]
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });
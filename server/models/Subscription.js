import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Please add a subscription name"],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, "Please add a price"],
            min: [0, "Price cannot be negative"],
        },
        billingCycle: {
            type: String,
            required: true,
            enum: ["monthly", "yearly", "weekly"],
            default: "monthly",
        },
        billingStartDate: {
            type: String,
            required: [true, "Please add a billing start date"],
        },
        appId: {
            type: String,
            default: "other",
        },
        color: {
            type: String,
            default: "#6b7280",
        },
        category: {
            type: String,
            default: "Other",
        },
    },
    {
        timestamps: true,
    }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;

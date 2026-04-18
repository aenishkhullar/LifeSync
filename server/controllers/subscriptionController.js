import Subscription from "../models/Subscription.js";

// @desc    Create a new subscription
// @route   POST /api/subscriptions
// @access  Private
const createSubscription = async (req, res) => {
    try {
        const { name, price, billingCycle, billingStartDate, appId, color } = req.body;

        if (!name || price === undefined || !billingStartDate) {
            res.status(400);
            throw new Error("Please provide name, price, and billing start date");
        }

        const subscription = await Subscription.create({
            user: req.user._id,
            name,
            price,
            billingCycle: billingCycle || "monthly",
            billingStartDate,
            appId: appId || "other",
            color: color || "#6b7280",
        });

        res.status(201).json({
            success: true,
            data: subscription,
        });
    } catch (error) {
        const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to create subscription",
        });
    }
};

// @desc    Get all subscriptions for logged-in user
// @route   GET /api/subscriptions
// @access  Private
const getSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ user: req.user._id }).sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            data: subscriptions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch subscriptions",
        });
    }
};

// @desc    Update a subscription
// @route   PUT /api/subscriptions/:id
// @access  Private
const updateSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            res.status(404);
            throw new Error("Subscription not found");
        }

        // Ensure user owns this subscription
        if (subscription.user.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error("Not authorized to update this subscription");
        }

        const { name, price, billingCycle, billingStartDate, appId, color } = req.body;

        subscription.name = name ?? subscription.name;
        subscription.price = price ?? subscription.price;
        subscription.billingCycle = billingCycle ?? subscription.billingCycle;
        subscription.billingStartDate = billingStartDate ?? subscription.billingStartDate;
        subscription.appId = appId ?? subscription.appId;
        subscription.color = color ?? subscription.color;

        const updatedSubscription = await subscription.save();

        res.status(200).json({
            success: true,
            data: updatedSubscription,
        });
    } catch (error) {
        const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to update subscription",
        });
    }
};

// @desc    Delete a subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private
const deleteSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            res.status(404);
            throw new Error("Subscription not found");
        }

        // Ensure user owns this subscription
        if (subscription.user.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error("Not authorized to delete this subscription");
        }

        await Subscription.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Subscription deleted",
        });
    } catch (error) {
        const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to delete subscription",
        });
    }
};

export { createSubscription, getSubscriptions, updateSubscription, deleteSubscription };

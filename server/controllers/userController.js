import User from "../models/User.js";

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
    try {
        const user = req.user;

        if (user) {
            res.json({
                success: true,
                data: user,
            });
        } else {
            res.status(404);
            throw new Error("User not found");
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user budget
// @route   PUT /api/user/budget
// @access  Private
const updateUserBudget = async (req, res) => {
    try {
        console.log("Incoming Budget Raw:", req.body.budget);
        console.log("Current User in Request:", req.user);

        const budget = Number(req.body.budget);

        if (isNaN(budget)) {
            res.status(400);
            throw new Error("Invalid budget value provided");
        }

        const user = await User.findById(req.user._id);
        
        if (user) {
            console.log("User found in DB for Save. Current monthlyBudget:", user.monthlyBudget);
            
            user.monthlyBudget = budget;
            
            await user.save();

            console.log("User successfully saved. New monthlyBudget:", user.monthlyBudget);
            
            res.json({
                success: true,
                monthlyBudget: user.monthlyBudget,
            });
        } else {
            res.status(404);
            throw new Error("User not found");
        }
    } catch (error) {
        console.error("Error in updateUserBudget:", error);
        return res.status(500).json({ message: error.message });
    }
};

export { getUserProfile, updateUserBudget };

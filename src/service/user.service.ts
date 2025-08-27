import subscriptionModel from "../model/subscription.model";
import User from "../model/user.model";

export const findUserByEmail = async (email: string) => await User.findOne({ email });
export const findUserByPhone = async (phoneNumber: string) => await User.findOne({ phoneNumber });
export const findUserById = async (id: string) => await User.findById(id);
export const findUserBySocialId = async (id: string, provider: number) => await User.findOne({
    socialLinkedAccounts: {
        $elemMatch: { id, provider }
    }
});

export const userData = (user: any) => {
  return { _id: user._id, email: user.email,name:user?.name || "" , bio:user?.bio||""}
};

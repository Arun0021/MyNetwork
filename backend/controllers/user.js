const User = require("../models/User");
const Post = require("../models/Post");
const { sendEmail } = require("../middleware/sendEmail");
const crypto = require("crypto");

//create user
exports.register = async(req,res)=>{
    try{
        const {name,email,password}= req.body;
        let user = await User.findOne({email});
        if(user){
            return res.status(400).json({
                success:false,
                message:"User already exists",
            })
        }

        user = await User.create({
            name,email,password,
            avatar:{
                public_id:"default",
                url:"default",
            }
        });

        const token = await user.generateToken();
        const options = {
            expires:new Date(Date.now()+90*24*3600*1000),
            httpOnly:true,
        }


        res.status(201).cookie("token",token,options).json({
            success:true,
            user,
            token,
        })



    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

//login user
exports.login = async(req,res,next)=>{
   try{ const {email,password} = req.body;
    const user  =await User.findOne({email}).select("+password");
    if(!user){
       return res.status(400).json({
            status:false,
            message:"User not found",
        })
    }

    const isMatched = await user.matchPassword(password);
    if(!isMatched){
       return res.status(400).json({
            status:false,
            message:"Password doesnot match",
        })
    }
    const token = await user.generateToken();
    const options = {
        expires:new Date(Date.now()+90*24*3600*1000),
        httpOnly:true,
    }

    res.status(200).cookie("token",token,options).json({
        success:true,
        user,
        token,
    })


}catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }


}
//log out user
exports.logout = async(req,res,next)=>{
    try{
        res.status(200).cookie("token",null,{
            expires:new Date(Date.now()),
            httpOnly:true,
        }).json({
            success:true,
            message:"Logged out",
        })
    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

// follow user
exports.followUser = async (req, res) => {
    try {
      const userToFollow = await User.findById(req.params.id);
      const loggedInUser = await User.findById(req.user._id);
  
      if (!userToFollow) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      if (loggedInUser.following.includes(userToFollow._id)) {
        const indexfollowing = loggedInUser.following.indexOf(userToFollow._id);
        const indexfollowers = userToFollow.followers.indexOf(loggedInUser._id);
  
        loggedInUser.following.splice(indexfollowing, 1);
        userToFollow.followers.splice(indexfollowers, 1);
  
        await loggedInUser.save();
        await userToFollow.save();
  
        res.status(200).json({
          success: true,
          message: "User Unfollowed",
        });
      } else {
        loggedInUser.following.push(userToFollow._id);
        userToFollow.followers.push(loggedInUser._id);
  
        await loggedInUser.save();
        await userToFollow.save();
  
        res.status(200).json({
          success: true,
          message: "User followed",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  //update password
  exports.updatePassword = async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("+password");
  
      const { oldPassword, newPassword } = req.body;
  
      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Please provide old and new password",
        });
      }
  
      const isMatch = await user.matchPassword(oldPassword);
  
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Incorrect Old password",
        });
      }
  
      user.password = newPassword;
      await user.save();
  
      res.status(200).json({
        success: true,
        message: "Password Updated",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  //update profile
  exports.updateProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
  
      const { name, email, avatar } = req.body;
  
      if (name) {
        user.name = name;
      }
      if (email) {
        user.email = email;
      }
  
      await user.save();
  
      res.status(200).json({
        success: true,
        message: "Profile Updated",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  //delete profile
  exports.deleteProfile = async(req,res,next)=>{
    try{
        const user = await User.findById(req.user._id);
        const posts = user.posts;
        const followers = user.followers;
        const following = user.following;
        const userId = user._id;

        await user.remove();
        res.cookie("token",null,{
            expires:new Date(Date.now()),
            httpOnly:true,
        })
        for(let i = 0 ;i<posts.length;i++){
            const post = await Post.findById(posts[i]);
         await post.remove();

        }
        for(let i=0;i<followers.length;i++){
            const follower = await User.findById(followers[i]);
            const index = follower.following.indexOf(userId);
            follower.following.splice(index,1);
            await follower.save();
        }
        for(let i=0;i<following;i++){
            const follow = await User.findById(following[i]);
            const index = follow.followers.indexOf(userId);
            follow.followers.splice(index,1);
            await follow.save();
        }
        res.status(200).json({
            success: true,
            message: "Profile Deleted",
          });

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
          });
    }
  }
// my profile
  exports.myProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user._id).populate(
        "posts followers following"
      );
  
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  //get user profile
  exports.getUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.params.id).populate(
        "posts followers following"
      );
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  //get all users
  exports.getAllUsers = async (req, res) => {
    try {
      const users = await User.find({});
  
      res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  //forgot password
  exports.forgotPassword = async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      const resetPasswordToken = user.getResetPasswordToken();
  
      await user.save();
  
      const resetUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/password/reset/${resetPasswordToken}`;
  
      const message = `Reset Your Password by clicking on the link below: \n\n ${resetUrl}`;
  
      try {
        await sendEmail({
          email: user.email,
          subject: "Reset Password",
          message,
        });
  
        res.status(200).json({
          success: true,
          message: `Email sent to ${user.email}`,
        });
      } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
  
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  
  //reset password
  exports.resetPassword = async (req, res) => {
    try {
      const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");
  
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
  
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Token is invalid or has expired",
        });
      }
  
      user.password = req.body.password;
  
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
  
      res.status(200).json({
        success: true,
        message: "Password Updated",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };



  //get my posts
  exports.getMyPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const posts = [];

    for (let i = 0; i < user.posts.length; i++) {
      const post = await Post.findById(user.posts[i]).populate(
        "likes comments.user owner"
      );
      posts.push(post);
    }

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    const posts = [];

    for (let i = 0; i < user.posts.length; i++) {
      const post = await Post.findById(user.posts[i]).populate(
        "likes comments.user owner"
      );
      posts.push(post);
    }

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
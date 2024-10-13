import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { upload_on_Cloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import mongoose from "mongoose";

dotenv.config({
    path: './.env'
})
const generateAccessAndRefreshToken = async (userid) => {
    try {
        const user = await User.findById(userid)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "error generating refresh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validationn - not empty
    //check if user already exists - user and email
    //check for imgs check for avatar
    //upload them cloudinary, avatar
    //create user object - create entry in db
    //remove password and referesh token from frontemd
    //check for user creatipon
    //return res
    console.log(req.files)
    const { fullName, username, email, password } = req.body
    console.log("email: ", email);


    // if (fullName == "") {
    //     throw new ApiError(400, "fullname is required")   method for validation beginner methods
    // }

    if (
        [fullName, email, password, username].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are compulsory")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email and uname exist")
    }

    // const avatarLocalPath = `C:\\VSCODE\\chai r backend\\backend first\\public\\temp\\${req.files?.avatar?.[0]?.path}` ;
    const avatarlocalpath = req.files.avatar[0].path

    // C:\VSCODE\chai r backend\backend first\public\temp\.gitkeep

    console.log(avatarlocalpath)
    // const coverImageLocalPath = await req.files?.coverImage[0]?.path

    if (!avatarlocalpath) {
        throw new ApiError(400, "avatar file is required")
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    const avatar = await upload_on_Cloudinary(avatarlocalpath)
    const coverImage = await upload_on_Cloudinary(coverImageLocalPath)

    // console.log(avatar)



    if (!avatar) {
        throw new ApiError(400, "avatar file is required cloudinary error")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        email,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "somethinig went wrog when registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered Successfully")
    )


})


const loginUser = asyncHandler(async (req, res) => {
    //req.body -> data
    //username and email
    //find the user
    //password check
    //acces and refresh token
    //send secure cookies

    const { email, username, password } = req.body
    // console.log(email);
    console.log(req.body)

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")

    // }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404, "invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const LoggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: LoggedInUser, accessToken, refreshToken
                },
                "user logged in succesful"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            },

        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User loggedout Successfully")
        )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, " refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newrefreshToken },
                    "access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentpassword = asyncHandler(async (req, res) => {
    const { oldPassword, newpassword } = req.body
    //as it is passes by auth middleware then there is one more field in req that is req.user thats why we can do the following

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid old password")
    }

    user.password = newpassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "current user fetched succesfully"))
})

const updateAccoountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    console.log(fullName, email);
    

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "account details updated successfully"))
})

const upadateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalpath = req.file?.path
    if (!avatarLocalpath) {
        throw new ApiError(400, "Avatar file is missiing")
    }

    const avatar = await upload_on_Cloudinary(avatarLocalpath)

    if (!avatar) {
        throw new ApiError(400, "error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }

    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image updated succesfylly")
        )
})

const upadateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalpath = req.file?.path
    if (!coverImageLocalpath) {
        throw new ApiError(400, "Cover Image local path file is missiing")
    }

    const coverImage = await upload_on_Cloudinary(coverImageLocalpath)

    if (!coverImage) {
        throw new ApiError(400, "error while uploading on cover")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }

    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated succesfylly")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "useername is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "SubscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribeToCount: {
                    $size: "SubscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribeToCount: 1,
                isSubscribed: 1,
                coverImage: 1,
                avatar: 1,
                email: 1,

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "user channel fetched successfully")
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)

            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentpassword,
    updateAccoountDetails,
    upadateUserAvatar,
    upadateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
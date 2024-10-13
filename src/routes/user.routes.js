import { Router } from "express";
import { loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken, 
    changeCurrentpassword, 
    getCurrentUser, 
    updateAccoountDetails,
    upadateUserAvatar, 
    upadateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router =  Router()

// router.route("/register").get((req,res)=>{
//     res.status(200).json({
//         message: 'ok'                            this is for testing purpose
//     })
// })

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)
// router.route("/login")

router.route("/login").post(
    loginUser
)

//secured routes
router.route("/logout").post(
    verifyJWT, logoutUser
)

router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentpassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccoountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), upadateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), upadateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router
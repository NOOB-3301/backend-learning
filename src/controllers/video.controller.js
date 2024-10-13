import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { upload_on_Cloudinary } from "../utils/Cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if (!title || !description) {
        throw new ApiError(400, "ttle or desc is not provided")
    }

    // TODO: get video, upload to cloudinary, create video
    const videoFile_localPath = req.files?.videoFile[0].path
    const thumbnail_localPath = req.files?.thumbnail[0].path

    if (!videoFile_localPath || !thumbnail_localPath) {
        throw new ApiError(400, "error while fetching the localpaths")
    }

    const video_url = await upload_on_Cloudinary(videoFile_localPath)
    const thubnail_url =    await upload_on_Cloudinary(thumbnail_localPath)

    if (!video_url || !thubnail_url) {
        throw new ApiError(500, "error whlel uploading in cloudinary")
    }

    const video = Video.create({
        title,
        description,
        videoFile: video_url.url,
        thumbnail: thubnail_url.url,
        duration: video_url.duration,
        owner:req.user._id
    })

    if (!video) {
        throw new ApiError(500, "error while creating the db entry")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, video, "new video entry created successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId) {
        throw new ApiError(400, "videoid not found")
    }
    const video = await Video.findById(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "video info fetched succesfully"
        )
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
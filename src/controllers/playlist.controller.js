import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    //get playlist name and description
    //validation for datas
    //create entry in the database
    if (!name || !description) {
        throw new ApiError(400, "both anme and description are required")
    }

    const createdplaylist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if (!createPlaylist) {
        throw new ApiError(400, "error while creating playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, createdplaylist, "playlist is created successfully")
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const user_playlsit = await Playlist.find({owner: userId})

    if (!user_playlsit){
        throw new ApiError(400, "error fetching the user playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user_playlsit, "user playlist fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!playlistId) {
        throw new ApiError(400,  "playlist id is required or playlist id not provided")
    }
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "playlist id is wrong")
    }

    res.status(200)
    .json(
        new ApiResponse(200, playlist, "playlist fetched succesfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    //find video 
    //update object push video in the array
    if (!playlistId || !videoId) {
        throw new ApiError(400, "playlist id or video id is missing")
    }
    const video_to_add = await Video.findById(videoId)

    if (!video_to_add) {
        throw new ApiError(400, "video is not found in the db")
    }

    const playlist_to_which_add = await Playlist.findById(playlistId)

    if (!playlist_to_which_add) {
        throw new ApiError(400, "error whiele finding playlist")
    }

    await playlist_to_which_add.videos.push(video_to_add)

    const final_svae = await playlist_to_which_add.save({validateBeforeSave: false})

    if (!final_svae) {
        throw new ApiError(400, "error while saving")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,final_svae, "video added successfully"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    const playlist = await Playlist.findById(playlistId)
    const video = await Video.findById(videoId)

    let playlist_vid_arr = playlist.videos

    let index = playlist_vid_arr.indexOf((vid)=> vid.toString() === videoId)

    if (index > -1) { // only splice array when item is found
        playlist_vid_arr.splice(index, 1); // 2nd parameter means remove one item only
        await playlist.save()
        return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "video deleted from playlist successfully")
        )
    }else{
        throw new ApiError(400, "index is not found or error while deleting the playlst")
    }

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    const playlist = await Playlist.find(playlistId)

    if (!playlist) {
        throw new ApiError(400, "playlist is not found ")
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!playlistId) {
        throw new ApiError(400, "playlst id is not provided")
    }

    if (!name || !description) {
        throw new ApiError(400, "name or description is missing")
    }

    const updated_playlist =await Playlist.findByIdAndUpdate(
        playlistId,
        {name, description},
        {new: true}
    )

    if (!updated_playlist) {
        throw new ApiError(500, "db serer error while upadteinng the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updated_playlist,
            "playlist updated successsfully"
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
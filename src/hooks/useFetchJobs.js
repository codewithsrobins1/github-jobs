import { useReducer, useEffect } from 'react'
import axios from 'axios'

//Define the Actions
const ACTIONS = {
    MAKE_REQUEST: 'make-request',
    GET_DATA: 'get_data',
    UPDATE_HAS_NEXT_PAGE: 'update-has-next-page',
    ERROR: 'error'
}


//BASE API URL
const BASE_URL = 'https://cors-anywhere.herokuapp.com/https://jobs.github.com/positions.json'

//Reduction Function -- Call everytime we call dispatch
function reducer(state, action){
    switch(action.type) {
        case ACTIONS.MAKE_REQUEST:
            return { loading: true, jobs: []}

        case ACTIONS.GET_DATA:
            return { ...state, loading: false, jobs: action.payload.jobs}

        case ACTIONS.UPDATE_HAS_NEXT_PAGE:
            return { ...state, hasNextPage: action.payload.hasNextPage }

        case ACTIONS.ERROR:
            return { ...state, loading: false, error: action.payload.error, jobs: [] }

        default:
            return state
    }
}


export default function useFetchJobs(params, page){
    const [state, dispatch] = useReducer(reducer, {  //whatever is passed to dispatch gets populated in action variable
        jobs: [], 
        loading: true
    })
    
    //Run useEffect whenever 'params' or 'page' changes
    useEffect(() => {

        //Create cancel token to use
        const cancelToken1 = axios.CancelToken.source()

        //Set the state to loading
        dispatch({type: ACTIONS.MAKE_REQUEST})
    
        //Once state is loading -- make request to api
        axios.get(BASE_URL, {
            //Get individual token
            cancelToken: cancelToken1.token,
            //Retrieve the JSON representation of a single job posting
            params: {
                markdown: true, 
                page: page, 
                ...params   //example params = description, location, fulltime
            }
        })
        .then(res => {
            dispatch({ 
                type: ACTIONS.GET_DATA, 
                payload: { jobs: res.data } //set jobs to be the object of jobs from the api
            })
        })
        .catch(e => {
            //If cancenlled b/c of axios, return immediately
            if(axios.isCancel(e)) return 
            dispatch({
                type: ACTIONS.ERROR, 
                payload: {error: e} 
            })
        })

        //Second Request to check for more pages
        //Create cancel token to use
        const cancelToken2 = axios.CancelToken.source()
        axios.get(BASE_URL, {
            //Get individual token
            cancelToken: cancelToken2.token,
            //Retrieve the JSON representation of a single job posting
            params: {
                markdown: true, 
                page: page + 1, 
                ...params   //example params = description, location, fulltime
            }
        })
        .then(res => {
            dispatch({ 
                type: ACTIONS.UPDATE_HAS_NEXT_PAGE, 
                payload: { hasNextPage: res.data.length !== 0 } //we have some data on next page true --- false if 0
            })
        })
        .catch(e => {
            //If cancenlled b/c of axios, return immediately
            if(axios.isCancel(e)) return 
            dispatch({
                type: ACTIONS.ERROR, 
                payload: {error: e} 
            })
        })

        //Clean Up The Old Code
        return () => {
            cancelToken1.cancel()
            cancelToken2.cancel()
        }

    }, [params, page])
    
    //Return the State
    return state
    }




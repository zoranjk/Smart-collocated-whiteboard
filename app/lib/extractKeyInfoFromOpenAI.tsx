import { Editor, TLShapeId, createShapeId } from '@tldraw/tldraw'
import { ResponseShape } from '../ResponseShape/ResponseShape'
import { getSelectionAsImageDataUrl } from './getSelectionAsImageDataUrl'
import {
    GPT4CompletionResponse,
    GPT4Message,
    MessageContent,
    fetchFromOpenAi,
} from './fetchFromOpenAi'

// This file is responsible for extracting key information from team conversation using OpenAI's model.
const systemPrompt = `Imagine you are a very smart and careful team facilitator that can help teams to extract key information in their disucssion. Your task is to identify those key information from a conversation transcript. You are given a list of idea note contents and transcript of discussion. Please return the list of key information, each item should be a short summary of unique key inforamtion that you think is relevant to the provided ideas. For each note, also highlight which existing note it may relate to. Return the results in the required JSON format.`
const assistantPrompt = `
The input JSON format is a list of notes and transcript of discussion:
{
    "notes": [
        {
            "id": "1",
            "text": "text of the idea"
        },
        {
            ...
        },
        {
            ...
        }
    ],
    "discussion": "transcript of the discussion"
}

The output JSON objects of ideas follow this format:
{
    "notes": [
        {
            "text": "short phrase of the key information from transcript",
			related_notes: ["note_id_1", "note_id_2", ...]
		},
		{
			...
        },
        {
            ...
        }
    ]
}
`

// The ideas and groups are optional. If they are not provided, we will do global affinity diagramming.
export async function extractInformation({ editor, transcript = "" }) {

    // first, we build the prompt that we'll send to openai.
    console.log("Calling extractInformation")
    // console.log("Ideas: ", ideas)
    const prompt = await buildPromptForOpenAi(editor, transcript)

    // TODO: create effect to show loading edges

    try {
        // If you're using the API key input, we preference the key from there.
        // It's okay if this is undefined—it will just mean that we'll use the
        // one in the .env file instead.
        const apiKeyFromDangerousApiKeyInput = (
            document.body.querySelector('#openai_key_risky_but_cool') as HTMLInputElement
        )?.value

        // make a request to openai. `fetchFromOpenAi` is a next.js server action,
        // so our api key is hidden.
        const openAiResponse = await fetchFromOpenAi(apiKeyFromDangerousApiKeyInput, {
            model: 'gpt-4-1106-preview',
            // model: process.env.MODEL_VERSION,
            response_format: { type: 'json_object' },
            max_tokens: 4096,
            temperature: 0,
            messages: prompt,
        })

        if (openAiResponse.error) {
            throw new Error(openAiResponse.error.message)
        }

        const response = openAiResponse.choices[0].message.content

        console.log('openAiResponse: ', response)
        const parsed_res = JSON.parse(response)
        return parsed_res.notes

        // populate the response shape with the html we got back from openai.
        // TODO: populate the edges between selected shapes
    } catch (e) {
        // if something went wrong, get rid of the unnecessary response shape

        // TODO: create effect to hide loading edges
        throw e
    }
}


// groups: group ids
async function buildPromptForOpenAi(editor, transcript) {

    // If no group provided, get the parent topic, text of each note

    const input = getInputJSON(editor, transcript)

    const userMessages: MessageContent = [
        {
            type: 'text',
            text: 'Input JSON is follow:',
        },
        {
            // send the text of all selected shapes, so that GPT can use it as a reference (if anything is hard to see)
            type: 'text',
            text: JSON.stringify(input)
        },
        {
            type: 'text',
            text: "Following is trasncript of discussion: " + transcript
        }
    ]

    // combine the user prompt with the system prompt
    return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessages },
        { role: 'assistant', content: assistantPrompt },
    ]
}

function getInputJSON(editor: Editor, transcript: string) {
    const allShapes = editor.getCurrentPageShapes()

    // when ideas are not provided, we get all the nodes
    const json = Array.from(allShapes)
        .map(shape => {
            if (
                shape.type === 'node'
            ) {
                return {
                    text: shape.props.text,
                    id: shape.id,
                }
            }
            return { text: null, id: null }
        })
        .filter(v => v.text !== null && v.text !== '')

    const res = {
        "notes": json,
        "transcript": transcript
    }

    return JSON.stringify(res)
}
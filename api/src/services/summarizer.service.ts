import { APIError } from '../middleware/error.middleware.js';
import { MeetingNoteStatus } from '@prisma/client';
import db from './database.service.js';
import meetingService from './meeting.service.js';
import openai from '../utils/openai.util.js';

class SummarizerService {
    private readonly SYSTEM_PROMPT = "You are a precise meeting-notes generator. Given a raw meeting transcript extract meeting notes strictly as per the JSON schema. Use UTC for dates. No extra text.";
    private readonly responseSchema = {
        type: "object",
        additionalProperties: false,
        properties: {
            summary: { type: "string" },

            key_insights: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                headline: { type: "string" },
                detail: { type: "string" },
                evidence: {
                    type: "array",
                    items: { type: "string" }
                }
                },
                // strict mode: ALL properties must be listed here
                required: ["headline", "detail", "evidence"]
            }
            },

            action_items: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                assignee: { type: "string" },
                task: { type: "string" },

                // Keep field present; allow null when no date is stated
                // Enforce YYYY-MM-DD when it's a string
                due_date: {
                    anyOf: [
                    { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                    { type: "null" }
                    ]
                },

                // Keep field present; allow null when not mentioned
                priority: {
                    anyOf: [
                    { type: "string", enum: ["P0", "P1", "P2"] },
                    { type: "null" }
                    ]
                },

                // 0.0–1.0; keep field present
                confidence: { type: "number", minimum: 0, maximum: 1 },

                // Keep field present; empty array if none
                evidence: {
                    type: "array",
                    items: { type: "string" }
                }
                },
                // strict mode: ALL properties must be listed here
                required: ["assignee", "task", "due_date", "priority", "confidence", "evidence"]
            }
            }
        },
        required: ["summary", "key_insights", "action_items"]
    } as const;


    private _wrapTranscript(t: string | object) {
        return `<TRANSCRIPT_START>\n${typeof t === "string" ? t : JSON.stringify(t, null, 2)}\n<TRANSCRIPT_END>`;
    } 

    async summarize(meetingUuid: string) {
        try {
            console.log('HIIIII, summarize triggered');

            const  { noteStatus, userId } = await meetingService.getByUuid(meetingUuid);
            console.log({
                noteStatus,
                userId
            })
            if(noteStatus.valueOf()==MeetingNoteStatus.SUMMARIZED)
                return;
            if(noteStatus.valueOf()!=MeetingNoteStatus.TRANSCRIBED.valueOf())
                throw new APIError(400, `meeting status should be ${MeetingNoteStatus.TRANSCRIBED}`);
            
            const transcript = await meetingService.getTranscript(meetingUuid, userId);

            const chat = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
            temperature: 0.1,
            response_format: {
                type: "json_schema",
                json_schema: { name: "meeting_notes", strict: true, schema: this.responseSchema }
            },
            messages: [
                { role: "system", content: this.SYSTEM_PROMPT },
                { role: "user", content: this._wrapTranscript(transcript) }
            ]
            });

            console.log(JSON.stringify(chat));

            const content = chat.choices[0]?.message?.content ?? "";

            const updates: any = {
                summaryJson: null,
                summaryRawText: null,
            }
            if(!content) {
                updates.noteStatus = MeetingNoteStatus.FAILED;
                updates.summaryRawText = `summarizing failed because llm returned no content`
            } else {
                try {
                    const summary = await JSON.parse(content);
                    updates.summaryJson = summary;
                    updates.noteStatus = MeetingNoteStatus.SUMMARIZED;
                } catch(e) {
                    updates.summaryRawText = content.toString();
                    updates.noteStatus = MeetingNoteStatus.FAILED;
                }
            }

            await db.meeting.update({
                where: {
                    uuid: meetingUuid
                },
                data: updates
            })

        } catch (e) {
            throw e;
        }
    }



}

export default new SummarizerService();
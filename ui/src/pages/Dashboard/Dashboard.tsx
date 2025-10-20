import "./Dashboard.css";
import Navbar from "../../components/Navbar/Navbar";
import NoMeetingsPlaceHolder from "../../components/NoMeetingsPlaceHolder/NoMeetingsPlaceHolder";
import { generateRandomUUID } from "../../utils/string.util";
import type { Meeting } from "../../utils/types.util"; 
import { useEffect, useState } from "react";
import MeetingSection from "../../components/MeetingSection/MeetingSection";
import { createMeeting, getUserMeetings, requestPresignPost, uploadWithPresignedPOST } from "../../services/api.service";
import { useNavigate } from "react-router";
import handleError from "../../utils/error.util";


type DashboardProps = {
  meetings?: Meeting[];
};

export default function Dashboard({}: DashboardProps) {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Array<Meeting>>([]);

  const sortMeetingsByCreatedAtDesc = (list: Meeting[]) => {
    const safeTime = (date?: string | null) => {
      if (!date) return 0;
      const value = new Date(date).getTime();
      return Number.isNaN(value) ? 0 : value;
    };

    return [...list].sort((a, b) => {
      const timeA = safeTime(a?.createdAt);
      const timeB = safeTime(b?.createdAt);
      return timeB - timeA;
    });
  };
  
   useEffect(() => {
    fetchMeetings()
   }, [])

   const fetchMeetings = async () => {
    try {
      const meetings = await getUserMeetings() ?? [];
      setMeetings(sortMeetingsByCreatedAtDesc(meetings));
    } catch(e) {
      throw e;
    }
   }


    const pickAudioFile = (): Promise<File | null> =>
      new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "audio/*";
        input.onchange = () => resolve(input.files?.[0] ?? null);
        input.click();
      });

      function  getAudioDuration(file: File): Promise<number>  {
          return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const audio = document.createElement("audio");
            audio.preload = "metadata";
            audio.src = url;
            audio.onloadedmetadata = () => {
              const d = audio.duration; // seconds
              URL.revokeObjectURL(url);
              resolve(d);
            };
            audio.onerror = () => {
              URL.revokeObjectURL(url);
              reject(new Error("Failed to load audio metadata"));
            };
          });
      };

   const handleUploadMeeting = async (e: any) => {
    try {
      e.preventDefault();
      const fileInfo = await pickAudioFile();
      if(!fileInfo) {
        console.error("issue uploading file. Please try again");
        return;
      }
      const durationInSecs = await getAudioDuration(fileInfo);

      if(
        (!fileInfo.type.includes("audio")) ||
        (fileInfo.size > (60*1024*1024)) ||
        (durationInSecs > (5.1*60) )
      ) {
        console.error("Only audio files under 60 MB and under 5 mins track length are allowed. Please try again.");
        window.alert("Only audio files under 60 MB and under 5 mins track length are allowed. Please try again.");
        return;
      }
      const fileName = fileInfo?.name ? `${fileInfo.name}_${Date.now()}` : `${generateRandomUUID()}_${Date.now()}`;
      const contentType = fileInfo?.type ?? "unknown";
      const fileSize = fileInfo?.size ?? 0;
      if(fileSize==0) {
        console.error("issue uploading file. file seems to be empty");
      }
      const meeting = await createMeeting(fileName);
      
      console.log('MEETING', meeting);
      if(!meeting?.uuid) throw new Error('meeting uuid not found');
      const res = await requestPresignPost(
        meeting.uuid,
        { fileName, fileSize, contentType }
      )
      console.log('PRESIGN_PARAMS', res);
      
      const uploadResponse = await uploadWithPresignedPOST({
        url: res?.uploadParams.url ?? "",
        fields: res?.uploadParams.fields ?? {},
        payload: fileInfo
      });

      console.log('UPLOAD_RESPONSE', uploadResponse);
    
      setMeetings((previousMeetings) =>
        sortMeetingsByCreatedAtDesc([...previousMeetings, meeting]),
      );
    
    } catch(e) {
      handleError(e);
    } 
    
    };

    const handleRecordMeeting = () => {
      navigate("/record")
    };

    // const handleRefreshMeetingStatus = () => {
    //   alert("Refresh Meeting Status Clicked");
    // }




  return (
    <main className="dash-root">
        <Navbar 
            showCtas={meetings.length!= 0 ? true : false} 
            showBackBtn={false}
            recordMeetingHandler={handleRecordMeeting}
            uploadMeetingHandler={handleUploadMeeting}
        />

      <section className="dash-card" aria-labelledby="meetings-heading">
        {meetings.length === 0 ? (
          <NoMeetingsPlaceHolder 
            recordMeetingHandler={handleRecordMeeting}
            uploadMeetingHandler={handleUploadMeeting}
          />
        ) : (
          <MeetingSection 
            meetings={meetings}
          />
        )}
      </section>
    </main>
  );
}


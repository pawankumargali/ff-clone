import CtaIcon from "../../assets/CtaIcon/CtaIcon";

type NoMeetingsPlaceHolderProps = {
    recordMeetingHandler: () => void;
    uploadMeetingHandler: (e: any) => void;
};

export default function NoMeetingsPlaceHolder(
{
    recordMeetingHandler, uploadMeetingHandler
}: NoMeetingsPlaceHolderProps
) {
    return (
        <div className="empty-state">
            <p>No meetings yet.</p>
            <div className="empty-actions">
                <button className="cta-btn" onClick={uploadMeetingHandler}>
                <CtaIcon />
                <span>Upload Meeting Audio</span>
                </button>
                <button className="cta-btn" onClick={recordMeetingHandler}>
                <CtaIcon />
                <span>Record New Meeting</span>
                </button>
            </div>
        </div>
    );
}
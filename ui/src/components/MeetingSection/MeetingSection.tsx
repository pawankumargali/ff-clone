import type { Meeting } from '../../utils/types.util';
import StatusPill from '../StatusPill/StatusPill';
import { fmtDate } from '../../utils/string.util';

type MeetingSectionProps = {
    meetings: Meeting[],
    refreshMeetingStatus: (uuid: string) => void
}
export default function MeetingSection({ meetings, refreshMeetingStatus }: MeetingSectionProps) {
    
    const handleOpen = (uuid: string) => {
      window.location.href = `/meetings/${uuid}`;
    };



    return (
        <>
        <div className="dash-card-head">
            <h2 id="meetings-heading">Meetings</h2>
        </div>
        <div className="table-wrap" role="region" aria-label="Meetings Table">
            <table className="meetings-table">
            <thead>
                <tr>
                <th>Title</th>
                <th className="th-hide-sm">Link</th>
                <th>Status</th>
                <th>Created</th>
                {/* <th className="th-actions">Refresh</th> */}
                </tr>
            </thead>
            <tbody>
                {meetings.length > 0  && meetings.map((m) => (
                <tr key={m.uuid}>
                    <td>
                    <button className="link-like" onClick={() => handleOpen(m.uuid)} aria-label={`Open ${m.title}`}>
                        {m.title}
                    </button>
                    </td>
                    <td className="td-hide-sm">{m.link || <span className="muted">—</span>}</td>
                    <td>
                    <StatusPill status={m.noteStatus} />
                    </td>
                    <td>{fmtDate(m.createdAt)}</td>
                    {/* <td className="td-actions">
                    <button className="ghost-btn" onClick={() => refreshMeetingStatus(m.uuid)} aria-label={`View ${m.title}`}>
                        View
                    </button>
                    </td> */}
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </>
    )
} 
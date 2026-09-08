import { PlaygroundCharacter } from './PlaygroundCharacter.jsx';
import '../../styles/playground.css';

export function PlaygroundStage({ participants = [], currentStudentId = null, onSelectParticipant }) {
  return (
    <div className="playground-stage-container">
      {/* Stage Backdrop Visual Grid */}
      <div className="playground-stage-backdrop">
        <div className="stage-floor-pattern" />
      </div>

      {/* Participants Container */}
      <div className="playground-stage-surface">
        {participants.length === 0 ? (
          <div className="empty-stage-prompt">
            <div className="empty-stage-icon">🎮</div>
            <h3>Waiting for Students...</h3>
            <p>Scan the QR code or enter the Join Code to jump onto the stage!</p>
          </div>
        ) : (
          participants.map(p => (
            <PlaygroundCharacter
              key={p.participantId}
              participant={p}
              isCurrentStudent={currentStudentId === p.participantId}
              onClick={() => onSelectParticipant && onSelectParticipant(p)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default PlaygroundStage;

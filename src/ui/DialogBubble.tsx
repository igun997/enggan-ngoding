type DialogBubbleProps = {
  speaker: string;
  text: string;
};

export default function DialogBubble({ speaker, text }: DialogBubbleProps) {
  return (
    <div className="dialog-bubble">
      <span className="dialog-speaker">{speaker}:</span> "{text}"
    </div>
  );
}

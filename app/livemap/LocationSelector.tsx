interface LocationSelectorProps {
  onClose: () => void;
}

export default function LocationSelector({ onClose }: LocationSelectorProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        background: '#01182F',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '4px',
        zIndex: 900,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '220px',
        height: '60px',
      }}
    >
      <span className="font-semibold">Select the Location</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'semi-bold',
          cursor: 'pointer',
          marginLeft: '10px',
        }}
      >
        ✕
      </button>
    </div>
  );
}

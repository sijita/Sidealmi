import { FaceMesh } from '@mediapipe/face_mesh';
import { useRef, useEffect, useState } from 'react';
import * as Facemesh from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';
import Webcam from 'react-webcam';
import sound from './sonido.mp3';

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const connect = window.drawConnectors;
  var camera = null;

  const [conteoMuestra, setConteoMuestra] = useState(0);

  let parpadeo = false;
  let conteo = 0;

  const [microSueno, setMicroSueno] = useState(0);

  const [isSleep, setIsSleep] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [audio, setAudio] = useState(new Audio(sound));

  const handleInitialTime = () => {
    setIsSleep(true);
    setIsPaused(false);
  };

  const handleIsPaused = () => {
    setIsPaused(true);
  };

  function onResults(results) {
    const px = [];
    const py = [];

    const lista = [];

    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        connect(canvasCtx, landmarks, Facemesh.FACEMESH_TESSELATION, {
          color: '#FFFFFF',
          lineWidth: 1,
        });
        // connect(canvasCtx, landmarks, Facemesh.FACEMESH_RIGHT_EYE, {
        //   color: '#FF3030',
        // });
        // connect(canvasCtx, landmarks, Facemesh.FACEMESH_RIGHT_EYEBROW, {
        //   color: '#FF3030',
        // });
        // connect(canvasCtx, landmarks, Facemesh.FACEMESH_LEFT_EYE, {
        //   color: '#30FF30',
        // });
        // connect(canvasCtx, landmarks, Facemesh.FACEMESH_LEFT_EYEBROW, {
        //   color: '#30FF30',
        // });
        // connect(canvasCtx, landmarks, Facemesh.FACEMESH_FACE_OVAL, {
        //   color: '#E0E0E0',
        // });
        // connect(canvasCtx, landmarks, Facemesh.FACEMESH_LIPS, {
        //   color: '#E0E0E0',
        // });

        for (const [id, element] of Object.entries(landmarks)) {
          const x = parseInt(element.x * 640);
          const y = parseInt(element.y * 480);

          px.push(x);
          py.push(y);

          lista.push([id, x, y]);

          if (lista.length === 468) {
            //ojo derecho
            let x1, y1;
            [x1, y1] = lista[145].slice(1);

            let x2, y2;
            [x2, y2] = lista[159].slice(1);

            const longitud1 = Math.hypot(x2 - x1, y2 - y1);

            // ojo izquierdo
            let x3, y3;
            [x3, y3] = lista[374].slice(1);

            let x4, y4;
            [x4, y4] = lista[386].slice(1);

            const longitud2 = Math.hypot(x4 - x3, y4 - y3);

            if (longitud1 <= 6 && longitud2 <= 6 && parpadeo == false) {
              conteo = conteo + 1;
              parpadeo = true;

              setConteoMuestra(conteo);

              handleInitialTime();
            } else if (longitud1 > 6 && longitud2 > 6 && parpadeo == true) {
              parpadeo = false;

              handleIsPaused();
            }
          }
        }
      }
    }
    canvasCtx.restore();
  }

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
    });

    faceMesh.onResults(onResults);

    if (
      typeof webcamRef.current !== 'undefined' &&
      webcamRef.current !== null
    ) {
      camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await faceMesh.send({ image: webcamRef.current.video });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

  useEffect(() => {
    let interval = null;

    if (isSleep && !isPaused) {
      setInitialTime(0);

      interval = setInterval(() => {
        setInitialTime((time) => time + 1);
      }, 1000);
    } else {
      clearInterval(interval);
      if (initialTime >= 2) {
        setMicroSueno(microSueno + 1);
      }
    }

    return () => clearInterval(interval);
  }, [isSleep, isPaused]);

  useEffect(() => {
    audio.loop = true;
    if (initialTime >= 2) {
      audio.play();
    }
  }, [initialTime]);

  return (
    <div className="App">
      <div className="navbar bg-base-200 justify-center py-5">
        <a href="/" className="btn btn-ghost normal-case text-4xl font-bold">
          Sidealmi
        </a>
      </div>
      <div className="flex flex-col h-screen">
        <Webcam
          ref={webcamRef}
          className="my-20 w-4/5 max-w-[640px] left-0 right-0 mx-auto z-10 rounded-lg"
          // style={{
          //   width: 640,
          //   height: 480,
          // }}
        />
        <canvas
          ref={canvasRef}
          className="output_canvas absolute my-20 w-4/5 max-w-[640px] left-0 right-0 mx-auto z-10 rounded-lg"
          // style={{
          //   width: 640,
          //   height: 480,
          // }}
        ></canvas>
        <div className="flex flex-col items-center justify-end gap-5 w-full">
          <h1 className="sm:text-5xl text-3xl font-bold">
            Conteo: {conteoMuestra}
          </h1>
          <h1 className="sm:text-5xl text-3xl font-bold">
            Micro sueños: {microSueno}
          </h1>
          <h1 className="sm:text-3xl text-3xl font-bold">
            Tiempo: {initialTime >= 2 ? initialTime : 0} s
          </h1>
          <button
            className="btn btn-error mt-5"
            onClick={() => {
              audio.pause();
              audio.loop = false;
            }}
          >
            Desactivar sonido
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

import sys, os, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".github", "scripts"))
import importlib.util
spec = importlib.util.spec_from_file_location("ej", os.path.join(os.path.dirname(__file__), "..", ".github", "scripts", "extract-join.py"))
ej = importlib.util.module_from_spec(spec); spec.loader.exec_module(ej)

STRS = {100: "placeId", 120: "isTeleport", 140: "gameJoinAttemptId", 200: "/v1/join-game", 220: "Content-Type", 240: "hello world", 260: "[FLog::GameJoinUtil] GameJoinUtil::joinGame", 300: 'x "joinOrigin": y'}
WAT = """(func (;1;) (type 0)
  i32.const 100
  i32.const 120
  i32.const 140
  i32.const 260
  call 2
)
(func (;2;) (type 0)
  i32.const 240
  i32.const 220
)
(func (;3;) (type 0)
  i32.const 200
  call 1
)
""".splitlines(True)

class T(unittest.TestCase):
    def test_targets(self):
        t = ej.find_targets(STRS)
        self.assertEqual(t[100][0], "key"); self.assertEqual(t[200][0], "url"); self.assertEqual(t[220][0], "header")
        self.assertEqual(t[300][0], "key"); self.assertNotIn(240, t)
    def test_scan_and_report(self):
        t = ej.find_targets(STRS); f = ej.scan(WAT, t, STRS)
        self.assertIn("body", f[1]); self.assertEqual(f[1]["keys"], 3); self.assertNotIn("body", f[2])
        self.assertIn("body", f[3]); self.assertEqual(f[1]["calls"], {2})
        rep, nb, wat = ej.report(f, t, STRS, ej.neighbors(t, STRS))
        self.assertIn("placeId | isTeleport | gameJoinAttemptId", rep)
        self.assertIn("callers=[3]", rep); self.assertIn("GameJoinUtil", rep)
        self.assertIn("(func (;1;)", wat)
if __name__ == "__main__": unittest.main()

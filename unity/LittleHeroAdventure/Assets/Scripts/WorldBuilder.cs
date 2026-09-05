using UnityEngine;

namespace LittleHero
{
    /// <summary>
    /// عالم ملون: تلال، أشجار، أزهار، سماء نجوم. يُولَّد بالكامل بالكود.
    /// </summary>
    public class WorldBuilder : MonoBehaviour
    {
        public PlayerController Hero { get; private set; }
        public CuteCreatureController[] Creatures { get; private set; }
        public StarController[] Stars { get; private set; }
        public Transform StageSpot { get; private set; }

        static readonly Color[] FlowerColors =
        {
            new Color(1f, 0.45f, 0.6f),
            new Color(1f, 0.85f, 0.2f),
            new Color(0.55f, 0.4f, 0.95f),
            new Color(1f, 0.55f, 0.15f)
        };

        public void Build()
        {
            EnsureCamera();
            BuildGround();
            ScatterNature();
            StageSpot = new GameObject("StageSpot").transform;
            StageSpot.position = new Vector3(0f, 0.1f, 4.5f);
            Hero = SpawnHero();
            Creatures = SpawnCreatures();
            Stars = SpawnStars(48);
        }

        void EnsureCamera()
        {
            var cam = Camera.main;
            if (cam == null)
            {
                var go = new GameObject("Main Camera");
                cam = go.AddComponent<Camera>();
                go.tag = "MainCamera";
                go.AddComponent<AudioListener>();
            }
            cam.transform.position = new Vector3(0f, 7.2f, -11f);
            cam.transform.rotation = Quaternion.Euler(22f, 0f, 0f);
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.35f, 0.55f, 0.85f);
            cam.farClipPlane = 180f;
        }

        void BuildGround()
        {
            const int res = 80;
            const float size = 70f;
            var mesh = new Mesh { name = "Hills" };
            var verts = new Vector3[(res + 1) * (res + 1)];
            var colors = new Color[verts.Length];
            var tris = new int[res * res * 6];
            int t = 0;
            for (int z = 0; z <= res; z++)
            {
                for (int x = 0; x <= res; x++)
                {
                    float u = x / (float)res;
                    float v = z / (float)res;
                    float wx = (u - 0.5f) * size;
                    float wz = (v - 0.5f) * size;
                    float h = Mathf.PerlinNoise(u * 3.2f, v * 3.2f) * 2.4f
                              + Mathf.PerlinNoise(u * 8f, v * 8f) * 0.35f;
                    int i = z * (res + 1) + x;
                    verts[i] = new Vector3(wx, h, wz);
                    colors[i] = Color.Lerp(
                        new Color(0.45f, 0.78f, 0.38f),
                        new Color(0.22f, 0.55f, 0.28f),
                        h / 2.8f);
                }
            }
            for (int z = 0; z < res; z++)
            {
                for (int x = 0; x < res; x++)
                {
                    int i = z * (res + 1) + x;
                    tris[t++] = i;
                    tris[t++] = i + res + 1;
                    tris[t++] = i + 1;
                    tris[t++] = i + 1;
                    tris[t++] = i + res + 1;
                    tris[t++] = i + res + 2;
                }
            }
            mesh.vertices = verts;
            mesh.colors = colors;
            mesh.triangles = tris;
            mesh.RecalculateNormals();

            var ground = new GameObject("Hills");
            ground.AddComponent<MeshFilter>().sharedMesh = mesh;
            var rend = ground.AddComponent<MeshRenderer>();
            rend.sharedMaterial = UnlitVertexColor();
            ground.AddComponent<MeshCollider>().sharedMesh = mesh;
        }

        void ScatterNature()
        {
            var rng = new System.Random(2022);
            for (int i = 0; i < 28; i++)
            {
                float x = (float)(rng.NextDouble() * 50 - 25);
                float z = (float)(rng.NextDouble() * 50 - 18);
                if (new Vector2(x, z).magnitude < 6f) continue;
                SpawnTree(new Vector3(x, SampleHeight(x, z), z), 1.4f + (float)rng.NextDouble());
            }
            for (int i = 0; i < 90; i++)
            {
                float x = (float)(rng.NextDouble() * 40 - 20);
                float z = (float)(rng.NextDouble() * 36 - 12);
                SpawnFlower(new Vector3(x, SampleHeight(x, z) + 0.05f, z), FlowerColors[rng.Next(FlowerColors.Length)]);
            }
        }

        public static float SampleHeight(float x, float z)
        {
            float u = x / 70f + 0.5f;
            float v = z / 70f + 0.5f;
            return Mathf.PerlinNoise(u * 3.2f, v * 3.2f) * 2.4f;
        }

        void SpawnTree(Vector3 pos, float scale)
        {
            var tree = new GameObject("Tree");
            tree.transform.position = pos;
            var trunk = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            trunk.name = "Trunk";
            trunk.transform.SetParent(tree.transform, false);
            trunk.transform.localScale = new Vector3(0.28f, 0.9f * scale, 0.28f);
            trunk.transform.localPosition = new Vector3(0f, 0.9f * scale, 0f);
            Paint(trunk, new Color(0.45f, 0.28f, 0.14f));
            Object.Destroy(trunk.GetComponent<Collider>());
            var leaves = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            leaves.name = "Leaves";
            leaves.transform.SetParent(tree.transform, false);
            leaves.transform.localScale = Vector3.one * (1.8f * scale);
            leaves.transform.localPosition = new Vector3(0f, 1.9f * scale, 0f);
            Paint(leaves, new Color(0.18f, 0.62f, 0.28f));
            Object.Destroy(leaves.GetComponent<Collider>());
        }

        void SpawnFlower(Vector3 pos, Color color)
        {
            var stem = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            stem.name = "Flower";
            stem.transform.position = pos;
            stem.transform.localScale = new Vector3(0.04f, 0.18f, 0.04f);
            Paint(stem, new Color(0.25f, 0.7f, 0.3f));
            Object.Destroy(stem.GetComponent<Collider>());
            var bloom = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            bloom.transform.SetParent(stem.transform, false);
            bloom.transform.localPosition = new Vector3(0f, 1.1f, 0f);
            bloom.transform.localScale = new Vector3(3.2f, 0.7f, 3.2f);
            Paint(bloom, color);
            Object.Destroy(bloom.GetComponent<Collider>());
        }

        PlayerController SpawnHero()
        {
            var go = BuildHumanoid("Hero", new Vector3(-1.4f, 0.1f, 3.6f), 1.15f);
            return go.AddComponent<PlayerController>();
        }

        CuteCreatureController[] SpawnCreatures()
        {
            var specs = new[]
            {
                CreatureKind.Bear, CreatureKind.Rabbit, CreatureKind.Cat, CreatureKind.Bird
            };
            var list = new CuteCreatureController[specs.Length];
            for (int i = 0; i < specs.Length; i++)
            {
                float x = -3.6f + i * 2.4f;
                var go = new GameObject(specs[i].ToString());
                go.transform.position = new Vector3(x, SampleHeight(x, 6.2f) + 0.2f, 6.2f);
                var c = go.AddComponent<CuteCreatureController>();
                c.Build(specs[i]);
                list[i] = c;
            }
            return list;
        }

        StarController[] SpawnStars(int count)
        {
            var list = new StarController[count];
            for (int i = 0; i < count; i++)
            {
                var go = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                go.name = "Star";
                Object.Destroy(go.GetComponent<Collider>());
                float ang = i / (float)count * Mathf.PI * 2f;
                go.transform.position = new Vector3(Mathf.Cos(ang) * 22f, 14f + (i % 5), Mathf.Sin(ang) * 22f);
                go.transform.localScale = Vector3.one * 0.18f;
                var star = go.AddComponent<StarController>();
                star.Setup(i);
                list[i] = star;
            }
            return list;
        }

        public static GameObject BuildHumanoid(string name, Vector3 pos, float scale)
        {
            var root = new GameObject(name);
            root.transform.position = pos;
            var body = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            body.name = "Body";
            body.transform.SetParent(root.transform, false);
            body.transform.localScale = new Vector3(0.7f, 0.9f, 0.55f) * scale;
            body.transform.localPosition = new Vector3(0f, 0.95f * scale, 0f);
            Object.Destroy(body.GetComponent<Collider>());
            var head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            head.name = "Head";
            head.transform.SetParent(root.transform, false);
            head.transform.localScale = Vector3.one * (0.7f * scale);
            head.transform.localPosition = new Vector3(0f, 1.85f * scale, 0f);
            Object.Destroy(head.GetComponent<Collider>());
            return root;
        }

        public static void Paint(GameObject go, Color color)
        {
            var rend = go.GetComponent<Renderer>();
            if (rend == null) return;
            rend.sharedMaterial = new Material(Shader.Find("Standard")) { color = color };
        }

        static Material UnlitVertexColor()
        {
            var shader = Shader.Find("Sprites/Default") ?? Shader.Find("Standard");
            return new Material(shader);
        }
    }
}

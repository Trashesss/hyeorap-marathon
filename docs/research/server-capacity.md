# 서버 한 대가 받을 수 있는 사람 수

- 조사한 날: 2026-10-09
- 쓰인 곳: [결정 0002](../decisions/0002-server-runs-the-match.md)

**이 문서의 수용 인원은 추정입니다.** 개발용 컴퓨터에서 잰 값에 여유를 곱한 것이고, 실제 AWS 서버에서 잰 적이 없습니다. 서버를 띄우면 다시 재서 이 문서를 고쳐야 합니다.

## 잰 값

`node scripts/bench.mjs`로 쟀습니다. Apple M5 Pro, Node 26.

| 항목 | 값 | 재는 방법 |
|---|---|---|
| 계산 | 방 하나가 1초에 0.71 ms (코어의 0.07%) | 실제 계산 모듈로 봇 여덟이 달리는 방 100개를 60초, 초당 30걸음 |
| 전송 | 방 하나가 1초에 0.58 ms (코어의 0.06%) | 연결 800개에 240바이트를 초당 20번. 같은 컴퓨터 안에서 |
| 전송량 | 한 사람에게 초당 4.7 KB, 5분 한 판에 1.4 MB | 240바이트 × 초당 20번 |

재지 않은 것이 있습니다.

- **상태 한 장의 크기.** 240바이트는 선수 여덟과 설치물을 숫자로 줄였을 때의 예상입니다. 전송 형식을 아직 정하지 않았습니다.
- **암호화와 웹소켓 처리.** 위의 전송은 암호화 없는 TCP입니다.
- **입력을 받는 비용.**
- **실제 네트워크.** 같은 컴퓨터 안에서 보낸 것이라 실제보다 쌉니다.

## 추정

서버가 개발용 컴퓨터보다 5~8배 느리고 위에서 재지 않은 비용이 그 안에 들어간다고 잡으면, 방 하나에 코어의 0.65~1.0%입니다.

AWS t3.micro는 가상 CPU 둘에 각각 10%까지를 계속 쓸 수 있습니다. Node는 한 가닥으로 도니 계속 쓸 수 있는 양은 코어 하나의 20%쯤입니다.

| 한계 | 추정 |
|---|---|
| 하루 종일 유지할 수 있는 방 | 20~30개 (160~240명) |
| 몇 시간 동안 몰릴 때 | 100개 넘게. 모아 둔 CPU 크레딧을 쓰는 동안 |
| 메모리 1GB | 연결 수천 개까지 여유로 예상 |

## 먼저 닿는 한계는 전송량

AWS는 밖으로 나가는 전송을 한 달 100GB까지 무료로 줍니다.

- 한 사람의 5분 한 판이 머리말을 더해 약 1.7MB라면, 한 달에 약 6만 번입니다. 하루 2,000번꼴입니다.
- 한 사람이 평균 세 판을 한다면 하루 650명쯤까지 무료 범위입니다.
- 넘으면 서울 리전 기준 1GB에 0.1달러대로 알고 있습니다. 요금표에서 직접 확인하지는 않았습니다.

전송량은 상태를 초당 20번 대신 10~15번 보내고 화면에서 사이를 메우면 줄어듭니다.

## AWS 프리 티어에서 확인할 것

계정을 만든 날에 따라 조건이 다릅니다.

| | 2025년 7월 15일 이전 계정 | 그 이후 계정 |
|---|---|---|
| 방식 | 12개월 무료 | 크레딧 100달러(활동을 마치면 최대 200달러), 6개월 또는 소진 시까지 |
| 무료 서버 | t2.micro 또는 t3.micro, 월 750시간 | t3.micro, t3.small, t4g.micro 등 |

- 어느 쪽이든 영구 무료가 아닙니다.
- t3는 기본이 "무제한" 모드입니다. 하루 평균 CPU가 기준을 넘으면 추가 요금이 붙습니다. "표준" 모드로 바꾸면 요금 대신 속도가 느려집니다.
- https 페이지에서는 암호화된 연결만 열 수 있어서 도메인과 인증서가 필요합니다.

## 출처

- [AWS Free Tier now offers $200 in credits and 6-month free plan](https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/)
- [Track your Free Tier usage for Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-free-tier-usage.html)
- [Key concepts for burstable performance instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html)
- [Unlimited mode for burstable performance instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-performance-instances-unlimited-mode.html)
- [AWS Data Transfer Free Tier (re:Post)](https://repost.aws/questions/QUzBhYwSqEQly68_-NdYvDVQ/aws-data-transfer-free-tier)

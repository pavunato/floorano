export const TOWNHOUSE_SAMPLE =`plan "Townhouse" width=20000 depth=5000 wall=200 {
  floor "Ground Floor" label="TẦNG 1 / GF" {
    room "WC" 1800*5000 at=0,0 color=#ede8de
    space "Kitchen" 5400*4100 at=1800,0 {
      stove 800*600 at=200,200
      sink 600*440 at=1200,200
      fridge 400*560 at=2000,200
    }
    stair "Thang Máy" 1300*1600 at=7200,0 style=straight
    stair "Cầu thang"  6700*900 at=1800,4100 style=straight orientation=rl
    space "Living Room" 6000*5000 at=8500,0 {
      tv 2400*200 at=1700,100
    }
    room "Outdoor-Gara" 4500*5000 at=14500,0 color=#e8f0e4 style=dashed {
      plant 600*600 at=700,800
      plant 400*400 at=1800,1000
      plant 500*500 at=1200,3400
    }
    space "Garden" 1000* at=19000,0 walls=r wall=200 {
      door 3000* class=r-1700 style=quadfold swing=out
    }
  }

  floor "Second Floor" label="TẦNG 2 / 2F" {
    room "Phòng Fan" 3900*2900 at=1800,0 wall=150 color=#ffefd5 {
      door class=b-200 style=single
    }
    stair "Cầu thang"  4800*700 at=3100,4100 style=straight orientation=rl
    space 1300*2100 at=1800,2900 wall=200 walls=l {
      door class=l-900 swing=out
    }
    space "Hành Lang" 4800*1200 at=3100,2900
    space "Làm việc" 2800*2900 at=5700,0 {
      desk
    }
    stair "Thang Máy" 1300*1600 at=7200,0 style=straight
    room "Vệ Sinh" 2600*2900 at=8500,0 color=#dce8f0 wall=150 {
      door class=b-300
    }
    room "Phòng Tom" 3100*3800 at=11100,0 {
      door class=b-200 style=single
      door 1200* class=b-1500 style=sliding
    }
    room "Phòng Master" 4300* at=14200,0 {
      door class=l-3800
      door 1800* class=r-2000 style=double swing=out
    }
    space "Ban Công" 1500* at=18500,00
  }

  floor "Third Floor" label="TẦNG 3 / 3F" {
    stair 2300*5000 at=0,0
    room "Master Bedroom" 6800*3800 at=2300,0 color=#d4edda {
      bed 2200*2600 at=1400,400
      desk 1800*700 at=4100,400
      wardrobe 6400*1400 at=200,3300
    }
    room "Ensuite Bath" 3600*3200 at=9100,0 color=#b8d4e0 {
      bathtub 1500*800 at=300,200
      shower 1400*1100 at=1900,200
      sink 3000*640 at=300,1700
      toilet 500*700 at=600,2800
    }
    room "Private Balcony" 3600*1300 at=9100,3500 color=#d4edda style=dashed {
      plant 400*400 at=500,400
      plant 300*300 at=1700,500
      plant 400*400 at=2800,300
    }
    room "Sky Garden" 3300*5000 at=12700,0 color=#e4f0e4 style=dashed {
      plant 700*700 at=400,600
      plant 500*500 at=1800,700
      plant 400*400 at=2400,400
      plant 600*600 at=800,3200
      plant 400*400 at=2000,3400
    }
  }
  column at="Living Room".tl
  column at="Living Room".tr
  column at="Living Room".bl
  column at="Living Room".br
  column at="Kitchen".tl
  column at="Cầu thang".bl
}`;
